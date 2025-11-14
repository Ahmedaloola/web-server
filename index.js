const express = require('express');
const session = require('express-session');
const app = express();
const port = 3000;

let activeUsers = 0;
let logs = [];

// جلسات لتتبع الزوار
app.use(session({
  secret: 'secret-key-56WH',
  resave: false,
  saveUninitialized: true,
}));

// قراءة API Key من Environment Variable
const SERVER_API_KEY = process.env.API_KEY || 'test-api-key';

// Middleware للتحقق من API Key
function verifyApiKey(req, res, next) {
  const key = req.query.apiKey;
  if (!key || key !== SERVER_API_KEY) {
    logs.push(`${new Date().toLocaleTimeString()}: Unauthorized access attempt`);
    return res.status(403).send('Error: Invalid API Key 🔒');
  }
  next();
}

// الصفحة الرئيسية (HTML + CSS + JS)
app.get('/', verifyApiKey, (req, res) => {
  if(!req.session.visited) {
    activeUsers++;
    req.session.visited = true;
  }

  const logHtml = logs.slice(-10).map(l => `<li>${l}</li>`).join('');

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>Secure Web Dashboard</title>
    <style>
      body { font-family: Arial; text-align:center; margin-top:30px; background:#f4f4f9; }
      button { margin:10px; padding:12px 25px; font-size:16px; cursor:pointer; border:none; border-radius:5px; background:#4CAF50; color:white; }
      button:hover { background:#45a049; }
      h1 { color: #333; }
      p { font-size:18px; }
      ul { text-align:left; display:inline-block; margin-top:20px; }
    </style>
  </head>
  <body>
    <h1>Secure Dashboard</h1>
    <button onclick="connect()">Connect</button>
    <button onclick="disconnect()">Disconnect</button>
    <button onclick="ping()">Ping</button>
    <p id="status">Active Users: ${activeUsers}</p>
    <p id="ping">Ping: N/A</p>

    <h2>Last Logs</h2>
    <ul>${logHtml}</ul>

    <script>
      const API_KEY = '${SERVER_API_KEY}'; // يمكن تغييره لكل مستخدم

      function connect() {
        fetch('/connect?apiKey=' + API_KEY).then(r=>r.text()).then(data=>{
          document.getElementById('status').innerText = data;
          refresh();
        });
      }
      function disconnect() {
        fetch('/disconnect?apiKey=' + API_KEY).then(r=>r.text()).then(data=>{
          document.getElementById('status').innerText = data;
          refresh();
        });
      }
      function ping() {
        const start = Date.now();
        fetch('/ping?apiKey=' + API_KEY).then(r=>r.text()).then(()=>{
          const ping = Date.now() - start;
          document.getElementById('ping').innerText = 'Ping: ' + ping + ' ms';
          refresh();
        });
      }

      function refresh(){
        fetch('/logs?apiKey=' + API_KEY).then(r=>r.json()).then(data=>{
          const ul = document.querySelector('ul');
          ul.innerHTML = data.slice(-10).map(l => '<li>' + l + '</li>').join('');
        });
      }

      setInterval(refresh, 5000); // تحديث تلقائي كل 5 ثواني
    </script>
  </body>
  </html>
  `;
  res.send(html);
});

// Ping
app.get('/ping', verifyApiKey, (req,res)=>{
  logs.push(`${new Date().toLocaleTimeString()}: Ping`);
  res.send('pong');
});

// Connect
app.get('/connect', verifyApiKey, (req,res)=>{
  activeUsers++;
  logs.push(`${new Date().toLocaleTimeString()}: Connect`);
  res.send(`Active Users: ${activeUsers}`);
});

// Disconnect
app.get('/disconnect', verifyApiKey, (req,res)=>{
  if(activeUsers>0) activeUsers--;
  logs.push(`${new Date().toLocaleTimeString()}: Disconnect`);
  res.send(`Active Users: ${activeUsers}`);
});

// Logs
app.get('/logs', verifyApiKey, (req,res)=>{
  res.json(logs);
});

app.listen(port, ()=>{
  console.log(`Secure Server running at http://localhost:${port}`);
});
