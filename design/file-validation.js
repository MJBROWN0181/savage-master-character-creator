// Validate supported file signatures, not only the browser-provided MIME label.
async function validateDemoFile(file){
  const bytes=new Uint8Array(await file.slice(0,512).arrayBuffer());
  const starts=(values)=>values.every((value,index)=>bytes[index]===value);
  if(file.type==='image/png')return starts([137,80,78,71,13,10,26,10]);
  if(file.type==='image/jpeg')return starts([255,216,255]);
  if(file.type==='image/webp')return starts([82,73,70,70])&&[87,69,66,80].every((v,i)=>bytes[i+8]===v);
  if(file.type==='application/pdf')return starts([37,80,68,70,45]);
  if(file.type==='text/plain')return !bytes.includes(0)&&!starts([77,90]);
  return false;
}
