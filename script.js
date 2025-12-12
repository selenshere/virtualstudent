const BACKEND_URL="https://virtualstudent.onrender.com";
let conversation=[];
async function callBackend(conv){
 const r=await fetch(BACKEND_URL+"/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({conversation:conv})});
 const d=await r.json(); return d.reply;
}
