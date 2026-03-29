from fastapi import APIRouter, UploadFile, File, Form, Request, Response, Body
from typing import List, Optional
import os
import re
import json
from controllers import pipeline_controller

router = APIRouter(prefix="/pipeline", tags=["Pipeline"])

@router.post("/preauth")
async def run_preauth(
    request: Request,
    patient_id: str = Form(...),
    files: List[UploadFile] = File(...),
    tpa_id: Optional[str] = Form(None),
):
    cms_dicts = request.app.state.cms_dicts
    return await pipeline_controller.run_preauth_pipeline(files, patient_id, cms_dicts, tpa_id=tpa_id)

@router.post("/admitted")
async def run_admitted(
    request: Request,
    patient_id: str = Form(...),
    files: List[UploadFile] = File(...),
    tpa_id: Optional[str] = Form(None),
):
    cms_dicts = request.app.state.cms_dicts
    return await pipeline_controller.run_admitted_pipeline(files, patient_id, cms_dicts, tpa_id=tpa_id)

@router.post("/export-html")
async def export_html(payload: dict = Body(...)):
    """
    Receives preauth_form_json and injects it into medi_assist.html for download.
    """
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    template_path = os.path.join(base_dir, "form_template", "medi_assist.html")
    
    if not os.path.exists(template_path):
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Template not found")
        
    with open(template_path, "r", encoding="utf-8") as f:
        html_content = f.read()
        
    # Replace the formData definition in the template
    # Look for 'const formData = { ... };' up to the next function/comment
    json_str = json.dumps(payload, indent=2)
    replacement = f"const formData = {json_str};"
    
    # We use a regex to replace the specific block
    # We find `const formData = {` up to `};` right before `function getVal` or `/* ====`.
    pattern = re.compile(r'const formData = \{.*?\};', re.DOTALL)
    # Use lambda to bypass re.sub treating escape characters in the replacement string as regex sequences!
    new_html = pattern.sub(lambda m: replacement, html_content)
    
    # If regex failed, just append it before </script> as a fallback (though regex should work)
    if replacement not in new_html:
        new_html = html_content.replace(
            "const formData = {", 
            f"const dummyData = {{}};\n{replacement}\nconst oldFormData ="
        )

    return Response(
        content=new_html,
        media_type="text/html",
        headers={
            "Content-Disposition": 'attachment; filename="MediAssist_PreAuth.html"'
        }
    )

