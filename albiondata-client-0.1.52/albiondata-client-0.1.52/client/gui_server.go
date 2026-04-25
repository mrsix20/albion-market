package client

import (
	"encoding/json"
	"fmt"
	"html/template"
	"net"
	"net/http"
	"os/exec"
	"runtime"
	"sync"

	"github.com/ao-data/albiondata-client/log"
)

type GuiStatus struct {
	IsRunning bool   `json:"isRunning"`
	Mode      string `json:"mode"`
	UserID    string `json:"userId"`
	ItemsSent int    `json:"itemsSent"`
	StatusMsg string `json:"statusMsg"`
}

var (
	currentStatus GuiStatus
	statusLock    sync.Mutex
)

func StartGuiServer(port int, startFunc func()) {
	currentStatus.StatusMsg = "Ready to start"
	currentStatus.Mode = "Global"
	if ConfigGlobal.UserID != "" && ConfigGlobal.UserID != "global" {
		currentStatus.Mode = "Private"
		currentStatus.UserID = ConfigGlobal.UserID
	}

	http.HandleFunc("/", handleIndex)
	http.HandleFunc("/api/status", handleStatus)
	http.HandleFunc("/api/save", handleSave)
	http.HandleFunc("/api/start", func(w http.ResponseWriter, r *http.Request) {
		statusLock.Lock()
		if !currentStatus.IsRunning {
			currentStatus.IsRunning = true
			currentStatus.StatusMsg = "Syncing with Albion Online..."
			go startFunc()
		}
		statusLock.Unlock()
		json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
	})

	// Find an available port if the requested one is busy
	listener, err := net.Listen("tcp", fmt.Sprintf("127.0.0.1:%d", port))
	if err != nil {
		listener, _ = net.Listen("tcp", "127.0.0.1:0")
	}
	actualPort := listener.Addr().(*net.TCPAddr).Port
	
	url := fmt.Sprintf("http://127.0.0.1:%d", actualPort)
	log.Infof("GUI Server started at %s", url)

	// Launch browser in app mode
	go launchBrowser(url)

	http.Serve(listener, nil)
}

func handleIndex(w http.ResponseWriter, r *http.Request) {
	tmpl := template.Must(template.New("index").Parse(htmlContent))
	tmpl.Execute(w, nil)
}

func handleStatus(w http.ResponseWriter, r *http.Request) {
	statusLock.Lock()
	defer statusLock.Unlock()
	json.NewEncoder(w).Encode(currentStatus)
}

func handleSave(w http.ResponseWriter, r *http.Request) {
	var data struct {
		Mode   string `json:"mode"`
		UserID string `json:"userId"`
	}
	if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
		http.Error(w, err.Error(), 400)
		return
	}

	statusLock.Lock()
	currentStatus.Mode = data.Mode
	currentStatus.UserID = data.UserID
	
	if data.Mode == "Private" {
		ConfigGlobal.UserID = data.UserID
	} else {
		ConfigGlobal.UserID = "global"
	}
	statusLock.Unlock()

	json.NewEncoder(w).Encode(map[string]string{"status": "saved"})
}

func UpdateGuiStats(count int) {
	statusLock.Lock()
	defer statusLock.Unlock()
	currentStatus.ItemsSent += count
}

func launchBrowser(url string) {
	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "windows":
		// Try to launch Edge in app mode, fallback to default browser
		cmd = exec.Command("cmd", "/c", "start", "msedge", "--app="+url)
	case "darwin":
		cmd = exec.Command("open", url)
	default:
		cmd = exec.Command("xdg-open", url)
	}
	cmd.Start()
}

const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Albion Market Hub - Client</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&family=JetBrains+Mono:wght@700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Outfit', sans-serif; background-color: #06080c; color: white; overflow: hidden; }
        .glow-amber { box-shadow: 0 0 20px rgba(245, 158, 11, 0.2); }
        .animate-float { animation: float 3s ease-in-out infinite; }
        @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-5px); } 100% { transform: translateY(0px); } }
    </style>
</head>
<body class="flex flex-col h-screen border-t-2 border-amber-500">
    <div class="p-8 flex-grow">
        <div class="flex items-center justify-between mb-12">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center font-black text-slate-900 text-xl shadow-lg">A</div>
                <div>
                    <h1 class="text-2xl font-black tracking-tight">Albion<span class="text-amber-500">Market</span></h1>
                    <p class="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">Data Sync Client v0.1.52</p>
                </div>
            </div>
            <div id="statusBadge" class="px-3 py-1 bg-slate-900 border border-white/10 rounded-full flex items-center gap-2">
                <div class="w-2 h-2 rounded-full bg-slate-600"></div>
                <span class="text-[10px] font-black uppercase text-slate-500 tracking-widest">Disconnected</span>
            </div>
        </div>

        <div class="grid grid-cols-2 gap-6 mb-10">
            <button onclick="setMode('Global')" id="btnGlobal" class="group relative p-6 bg-slate-900/50 border-2 border-white/5 rounded-3xl text-left transition-all hover:border-amber-500/30">
                <div class="absolute top-4 right-4 w-5 h-5 rounded-full border-2 border-white/10 flex items-center justify-center" id="checkGlobal"></div>
                <h3 class="text-lg font-black mb-1 group-hover:text-amber-500 transition-colors">Global Mode</h3>
                <p class="text-xs text-slate-500 leading-tight">Send data to the public pool for everyone to see.</p>
            </button>
            <button onclick="setMode('Private')" id="btnPrivate" class="group relative p-6 bg-slate-900/50 border-2 border-white/5 rounded-3xl text-left transition-all hover:border-amber-500/30">
                <div class="absolute top-4 right-4 w-5 h-5 rounded-full border-2 border-white/10 flex items-center justify-center" id="checkPrivate"></div>
                <h3 class="text-lg font-black mb-1 group-hover:text-amber-500 transition-colors">Private Mode</h3>
                <p class="text-xs text-slate-500 leading-tight">Sync exclusively to your personal account.</p>
            </button>
        </div>

        <div id="privateInput" class="hidden space-y-3 mb-10 animate-in fade-in slide-in-from-top-2">
            <label class="text-[10px] text-amber-500 font-black uppercase tracking-widest ml-1">Your Sync ID</label>
            <input type="text" id="userId" placeholder="Enter ID from your Profile page..." 
                class="w-full bg-slate-950 border-2 border-white/5 rounded-2xl px-6 py-4 text-sm font-bold text-amber-500 placeholder:text-slate-700 focus:border-amber-500/50 focus:outline-none transition-all">
        </div>

        <div id="statsBox" class="hidden grid grid-cols-2 gap-4 mb-10">
            <div class="bg-white/5 rounded-2xl p-4 border border-white/5 text-center">
                <p class="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Items Sent</p>
                <p id="itemsSent" class="text-2xl font-black text-white font-mono">0</p>
            </div>
            <div class="bg-white/5 rounded-2xl p-4 border border-white/5 text-center">
                <p class="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Current Port</p>
                <p class="text-2xl font-black text-white font-mono">8000</p>
            </div>
        </div>

        <button id="startBtn" onclick="startSync()" class="w-full py-5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl shadow-xl shadow-amber-500/20 transition-all active:scale-95 text-lg flex items-center justify-center gap-3">
            <span>🚀 Start Market Sync</span>
        </button>
    </div>

    <div class="p-6 bg-slate-950 border-t border-white/5 flex items-center justify-between">
        <p id="statusMsg" class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Waiting for user action...</p>
        <div class="flex gap-4">
            <a href="#" class="text-[10px] font-black text-slate-600 hover:text-white transition-colors uppercase">Support</a>
            <a href="#" class="text-[10px] font-black text-slate-600 hover:text-white transition-colors uppercase">Website</a>
        </div>
    </div>

    <script>
        let currentMode = 'Global';

        async function updateStatus() {
            const resp = await fetch('/api/status');
            const data = await resp.json();
            
            document.getElementById('itemsSent').innerText = data.itemsSent;
            document.getElementById('statusMsg').innerText = data.statusMsg;

            if (data.isRunning) {
                document.getElementById('startBtn').disabled = true;
                document.getElementById('startBtn').classList.add('opacity-50', 'cursor-not-allowed');
                document.getElementById('startBtn').innerText = '⚡ Client is Active';
                document.getElementById('statsBox').classList.remove('hidden');
                document.getElementById('statusBadge').children[0].classList.replace('bg-slate-600', 'bg-emerald-500');
                document.getElementById('statusBadge').children[1].innerText = 'Active';
                document.getElementById('statusBadge').children[1].classList.replace('text-slate-500', 'text-emerald-500');
            }
        }

        function setMode(mode) {
            currentMode = mode;
            const isPrivate = mode === 'Private';
            
            document.getElementById('privateInput').style.display = isPrivate ? 'block' : 'none';
            document.getElementById('btnPrivate').classList.toggle('border-amber-500/50', isPrivate);
            document.getElementById('btnGlobal').classList.toggle('border-amber-500/50', !isPrivate);
            document.getElementById('checkPrivate').innerHTML = isPrivate ? '<div class="w-2.5 h-2.5 bg-amber-500 rounded-full"></div>' : '';
            document.getElementById('checkGlobal').innerHTML = !isPrivate ? '<div class="w-2.5 h-2.5 bg-amber-500 rounded-full"></div>' : '';
        }

        async function startSync() {
            const userId = document.getElementById('userId').value;
            
            // Save config first
            await fetch('/api/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mode: currentMode, userId: userId })
            });

            // Start sync
            await fetch('/api/start', { method: 'POST' });
            
            document.getElementById('startBtn').innerText = 'Connecting...';
        }

        setMode('Global');
        setInterval(updateStatus, 1000);
    </script>
</body>
</html>
`
