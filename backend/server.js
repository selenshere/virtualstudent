const express=require("express");
const cors=require("cors");
const fetch=require("node-fetch");
const app=express(); app.use(cors()); app.use(express.json());
const PORT=process.env.PORT||10000;
const SYSTEM_PROMPT="Taylor persona...";
app.post("/chat",async(req,res)=>{
 const messages=[{role:"system",content:SYSTEM_PROMPT},...(req.body.conversation||[])];
 const r=await fetch("https://api.openai.com/v1/chat/completions",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+process.env.OPENAI_API_KEY},body:JSON.stringify({model:"gpt-4o-mini",messages})});
 const d=await r.json(); res.json({reply:d.choices[0].message.content});
});
app.get("/",(req,res)=>res.json({status:"ok"}));
app.listen(PORT,()=>console.log("running"));
