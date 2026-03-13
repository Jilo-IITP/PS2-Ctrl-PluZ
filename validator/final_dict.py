import pandas as pd
import glob
import os

def load_and_concat_cms_files(folder_path, file_pattern, skiprows=0):
    """Generic function to load split multi-part files and align headers before concatenating."""
    search_path = os.path.join(folder_path, file_pattern)
    files = glob.glob(search_path)
    print(f"📁 Found {len(files)} files for pattern: {file_pattern}")
    
    df_list = []
    for f in files:
        if ".pkl" in f or "~$" in f: continue # Skip caches and temp open files
        
        ext = os.path.splitext(f)[1].lower()
        try:
            if ext in ['.csv', '.txt']:
                try:
                    df = pd.read_csv(f, skiprows=skiprows, low_memory=False, dtype=str, encoding='latin1')
                except Exception:
                    df = pd.read_csv(f, skiprows=skiprows, sep='\t', low_memory=False, dtype=str, encoding='latin1')
            elif ext in ['.xlsx', '.xls', '']:
                df = pd.read_excel(f, skiprows=skiprows, dtype=str)
            else:
                continue

            if not df.empty:
                # CRITICAL: Standardize columns BEFORE concat to prevent split-file misalignment
                df.columns = df.columns.astype(str).str.strip().str.upper()
                df_list.append(df)
                
        except Exception as e:
            print(f"❌ Error reading {os.path.basename(f)}: {e}")

    return pd.concat(df_list, ignore_index=True) if df_list else pd.DataFrame()


def get_cached_df(cache_name, folder_path, pattern, skiprows=0):
    cache_path = os.path.join(folder_path, cache_name)
    if os.path.exists(cache_path):
        print(f"⚡ Loading from cache: {cache_name}")
        return pd.read_pickle(cache_path)
    else:
        print(f"⏳ Parsing raw files to create {cache_name}...")
        df = load_and_concat_cms_files(folder_path, pattern, skiprows)
        if not df.empty:
            df.to_pickle(cache_path)
        return df


def build_dictionaries(ptp_df, mue_df, hcpcs_df, ncd_df):
    print("🚀 Building O(1) lookup dictionaries...")
    
    # --- 1. MUE (Quantity Limits) ---
    mue_code_col = [c for c in mue_df.columns if 'HCPCS' in c][0]
    mue_val_col = [c for c in mue_df.columns if 'MUE' in c and 'VALUE' in c][0]
    
    mue_clean = mue_df[mue_df[mue_val_col] != '0'].dropna(subset=[mue_code_col, mue_val_col])
    # The .astype(str).str.strip() is the magic cleaner here
    mue_limits = dict(zip(
        mue_clean[mue_code_col].astype(str).str.strip(), 
        pd.to_numeric(mue_clean[mue_val_col], errors='coerce').fillna(999).astype(int)
    ))

    # --- 2. GENDER DEMOGRAPHICS (Vectorized) ---
    gender_codes = {}
    if not hcpcs_df.empty:
        code_col = hcpcs_df.columns[0]
        # Combine all descriptive columns into one lowercase text string per row
        text_series = hcpcs_df.drop(columns=[code_col]).astype(str).apply(lambda x: ' '.join(x), axis=1).str.lower()
        
        # Vectorized boolean masks (Extremely fast compared to iterrows)
        is_female = text_series.str.contains('female|maternity|ovary|uterus', na=False)
        is_male = text_series.str.contains('male|prostate|testis', na=False) & ~is_female
        
        # Extract codes
        female_codes = hcpcs_df.loc[is_female, code_col].str.strip()
        male_codes = hcpcs_df.loc[is_male, code_col].str.strip()
        
        for code in female_codes: gender_codes[code] = 'female'
        for code in male_codes: gender_codes[code] = 'male'

    # --- 3. PTP (Unbundling Edits) ---
    ptp_dict = {}
    if not ptp_df.empty:
        # Assuming CMS standard headers 'COLUMN 1' and 'COLUMN 2'
        col1 = [c for c in ptp_df.columns if 'COLUMN 1' in c or 'COL 1' in c][0]
        col2 = [c for c in ptp_df.columns if 'COLUMN 2' in c or 'COL 2' in c][0]
        
        # Creates O(1) Set Lookup: { 'Comprehensive_Code': {'Unbundled_Code1', 'Unbundled_Code2'} }
        ptp_dict = ptp_df.groupby(col1)[col2].apply(lambda x: set(x.astype(str).str.strip())).to_dict()

    # --- 4. NCD (Diagnosis Crosswalk) - Brute Force Extraction ---
    ncd_dict = {}
    if not ncd_df.empty:
        print("🔍 Running deep scan on NCD file formatting...")
        
        # We assume the user passed skiprows=0 for NCD in get_cached_df
        # so we have the raw, unformatted spreadsheet data.
        
        current_ncd = None
        current_cpt_list = []
        
        # Iterate through every row in the raw dataframe
        for index, row in ncd_df.iterrows():
            row_str = " ".join([str(x).upper() for x in row.values if pd.notna(x)])
            
            # 1. Detect if we entered a new NCD section (e.g., "190.12")
            # Usually, the NCD number is the first item on a new block
            first_val = str(row.values[0]).strip()
            if first_val.replace('.', '').isdigit() and len(first_val) > 3:
                current_ncd = first_val
                # Reset the CPT list when we hit a new NCD block
                current_cpt_list = [] 
                
            # 2. Extract CPT Codes (5-digit alphanumeric)
            # We look for cells that are 5 chars long, mostly digits
            cpts_in_row = [str(x).strip() for x in row.values if pd.notna(x) and len(str(x).strip()) == 5 and str(x).strip()[:4].isdigit()]
            if cpts_in_row:
                current_cpt_list.extend(cpts_in_row)
                
            # 3. Extract ICD-10 Codes (Starts with a letter, followed by digits, e.g., A00.1)
            icd_in_row = []
            for cell in row.values:
                cell_str = str(cell).strip().upper()
                if len(cell_str) >= 3 and cell_str[0].isalpha() and cell_str[1:3].isdigit():
                    # Clean up random trailing whitespace or weird characters
                    clean_icd = cell_str.split()[0].replace('.', '')
                    icd_in_row.append(clean_icd)
            
            # 4. Map them together
            # If we found ICD-10 codes, map them to all CPTs active in this NCD block
            if icd_in_row and current_cpt_list:
                for cpt in current_cpt_list:
                    if cpt not in ncd_dict:
                        ncd_dict[cpt] = set()
                    ncd_dict[cpt].update(icd_in_row)

                    
    print("✅ Dictionaries generated successfully!")
    return ptp_dict, mue_limits, gender_codes, ncd_dict

if __name__ == "__main__":
    base_dir = r"..\data"
    
    # CMS files usually have headers on row 2 (skiprows=1), verify this for NCD/HCPCS if they error out
    # Change skiprows to 2 to bypass the copyright and title rows
    ptp_df = get_cached_df("cache_ptp.pkl", base_dir, "ccipra*", skiprows=2)
    mue_df = get_cached_df("cache_mue.pkl", base_dir, "MCR_MUE*", skiprows=1)
    hcpcs_df = get_cached_df("cache_hcpcs.pkl", base_dir, "Data_HCPCS.txt", skiprows=0)
    ncd_df = get_cached_df("cache_ncd.pkl", base_dir, "*Initial-ICD10-NCD-Spreadsheet*", skiprows=0)

    # Generate the fast-lookup dictionaries
    ptp_dict, mue_dict, gender_dict, ncd_dict = build_dictionaries(ptp_df, mue_df, hcpcs_df, ncd_df)