import re

def parse_icd_structure_absolute(raw_text: str) -> list[dict]:
    # Looks for optional asterisks/spaces, exactly 3 chars (e.g., A07), a space, then the title
    parent_pattern = re.compile(r'^[\*\s]*([A-Z][0-9]{2})\s+(.*)$')
    
    chunks = []
    current_chunk_lines = []
    current_code = None
    current_name = None
    chunk_counter = 0

    for line in raw_text.split('\n'):
        line = line.strip()
        if not line:
            continue
            
        match = parent_pattern.match(line)
        
        if match:
            # We hit a new parent code (e.g., **A08 Viral...**)
            if current_code and current_chunk_lines:
                chunks.append({
                    "text": "\n".join(current_chunk_lines),
                    "chunk_index": chunk_counter,
                    "metadata": {
                        "parent_code": current_code,
                        "disease_family": current_name
                    }
                })
                chunk_counter += 1
            
            # Open the new bucket
            current_code = match.group(1)
            # Strip the trailing asterisks from the title for clean metadata
            current_name = match.group(2).replace("*", "").strip()
            current_chunk_lines = [line]
            
        else:
            # It's a sub-code (A07.0) or description. Dump it in the current bucket.
            if current_code:
                current_chunk_lines.append(line)

    # Append the final bucket
    if current_code and current_chunk_lines:
        chunks.append({
            "text": "\n".join(current_chunk_lines),
            "chunk_index": chunk_counter,
            "metadata": {
                "parent_code": current_code,
                "disease_family": current_name
            }
        })

    return chunks