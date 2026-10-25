const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.GEMINI_API_KEY;

const page = `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>AI ARENA</title>
<style>
*{box-sizing:border-box}
body{margin:0;background:#090d18;color:#edf2ff;
font-family:Arial,sans-serif;padding:22px}
main{max-width:850px;margin:auto}
h1{font-size:38px;margin-bottom:6px}
.sub{color:#9aa9c7;line-height:1.6}
.tag{color:#76f0cf;font-size:12px;letter-spacing:3px}
textarea{width:100%;min-height:120px;background:#111a2c;
color:white;border:1px solid #34415d;border-radius:14px;
padding:16px;font-size:16px;resize:vertical}
button{width:100%;padding:15px;border:0;border-radius:12px;
background:#76f0cf;color:#06131a;font-size:16px;
font-weight:bold;margin-top:12px}
button:disabled{opacity:.5}
#status{color:#76f0cf;margin:18px 0}
.card{background:#111827;border:1px solid #29354c;
border-radius:14px;padding:18px;margin:12px 0}
.card h2{font-size:17px;margin-top:0;color:#76f0cf}
.answer{white-space:pre-wrap;line-height:1.7;color:#e0e7f6}
footer{font-size:12px;color:#8290aa;margin-top:24px}
</style>
</head>
<body><main>
<div class="tag">INDEPENDENT THINKING LAB</div>
<h1>AI ARENA</h1>
<p class="sub">Bir soru. Üç bakış açısı. Daha güçlü bir fikir.
<br>Yapay zekâ düşüncelerini karşılaştırma laboratuvarı.</p>
<textarea id="question" maxlength="2000"
placeholder="Örneğin: İnterneti yeniden tasarlasaydın nasıl bir şey yapardın?"></textarea>
<button id="run" onclick="startDebate()">ARENA'YI BAŞLAT</button>
<div id="status">Sistem hazır. Bir soru yaz.</div>
<div id="results"></div>
<footer>AI ARENA • Deneysel proje • Model cevapları hata içerebilir.</footer>
</main>
<script>
async function startDebate(){
 const q=document.getElementById("question").value.trim();
 if(!q){document.getElementById("status").textContent="Önce bir soru yaz.";return}
 const btn=document.getElementById("run");
 const status=document.getElementById("status");
 const results=document.getElementById("results");
 btn.disabled=true;results.innerHTML="";
 status.textContent="Üç bakış açısı hazırlanıyor...";
 try{
  const response=await fetch("/api/debate",{
   method:"POST",
   headers:{"Content-Type":"application/json"},
   body:JSON.stringify({question:q})
  });
  const data=await response.json();
  if(!response.ok)throw new Error(data.error||"Bir hata oluştu.");
  for(const item of data.answers){
   const card=document.createElement("section");
   card.className="card";
   const title=document.createElement("h2");
   title.textContent=item.role;
   const text=document.createElement("div");
   text.className="answer";
   text.textContent=item.text;
   card.append(title,text);
   results.append(card);
  }
  status.textContent="Analiz tamamlandı.";
 }catch(e){
  status.textContent="Bağlantı kurulamadı: "+e.message;
 }finally{btn.disabled=false}
}
</script>
</body></html>`;

function send(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(data));
}

async function askGemini(question, role) {
  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": API_KEY
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text:
              "Sen AI ARENA adlı fikir laboratuvarında görevli bir yapay zekâsın. " +
              "Rolün: " + role + ". " +
              "Kullanıcının sorusuna Türkçe, somut ve yaratıcı cevap ver. " +
              "Kısa başlıklar kullan; belirsizlikleri dürüstçe belirt. " +
              "Soru: " + question
          }]
        }],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 700
        }
      })
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error?.message || "Gemini API isteği başarısız oldu."
    );
  }

  return data.candidates?.[0]?.content?.parts
    ?.map(part => part.text || "")
    .join("\n") || "Bu rolde cevap alınamadı.";
}

const server = http.createServer(async (req, res) => {
  if (req.url === "/arena" && req.method === "GET") {
    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8"
    });
    return res.end(page);
  }

  if (req.url === "/api/debate" && req.method === "POST") {
    if (!API_KEY) {
      return send(res, 503, {
        error: "API anahtarı henüz sunucuya eklenmedi."
      });
    }

    let body = "";
    req.on("data", chunk => {
      body += chunk;
      if (body.length > 10000) req.destroy();
    });

    req.on("end", async () => {
      try {
        const input = JSON.parse(body);
        const question = String(input.question || "").trim();

        if (!question || question.length > 2000) {
          return send(res, 400, {
            error: "Soru boş olamaz ve 2000 karakteri aşamaz."
          });
        }

        const roles = [
          "MUCİT: Alışılmadık çözümler ve yeni olasılıklar üret.",
          "ELEŞTİRMEN: Riskleri, zayıf noktaları ve varsayımları incele.",
          "STRATEJİST: Uygulanabilir bir plan ve somut adımlar öner."
        ];

        const answers = await Promise.all(
          roles.map(async role => ({
            role: role.split(":")[0],
            text: await askGemini(question, role)
          }))
        );

        send(res, 200, { answers });
      } catch (error) {
        console.error("Arena hatası:", error.message);
        send(res, 502, {
          error: "Model cevap veremedi. API kotasını ve bağlantıyı kontrol et."
        });
      }
    });
    return;
  }

  if (req.url === "/" && req.method === "GET") {
    return fs.readFile(
      path.join(__dirname, "index.html"),
      (err, content) => {
        if (err) {
          res.writeHead(500);
          return res.end("index.html bulunamadi");
        }
        res.writeHead(200, {
          "Content-Type": "text/html; charset=utf-8"
        });
        res.end(content);
      }
    );
  }

  res.writeHead(404);
  res.end("Sayfa bulunamadi");
});

server.listen(PORT, () => {
  console.log("AI ARENA sunucusu " + PORT + " portunda hazır.");
});
