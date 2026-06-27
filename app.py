"""
H5 Customer Portal - Simplified Version
Provides customer-facing H5 pages for company intro, recruitment, and agent flow monitoring
"""

import os
import time
import json
import threading
from datetime import datetime
from flask import Flask, request, jsonify, render_template, redirect, url_for, session, g, send_from_directory
from flask_sock import Sock


# Create Flask app
app = Flask(__name__,
            template_folder='templates',
            static_folder='front',
            static_url_path='/front')
app.secret_key = os.environ.get("APP_SECRET_KEY", "h5-secret-key-change-in-production")
sock = Sock(app)

# Get the directory where app.py is located
APP_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(APP_DIR, "data")
APPLICATIONS_FILE = os.path.join(DATA_DIR, "fde_applications.jsonl")
# =============================================================================
# WebSocket Setup (For Real-time Monitoring & Simulation)
# =============================================================================
connected_clients = []

SIMULATION_CONFIG = {
    "dispatchTargets": [
        { "role": "供应方", "content": "匹配产品与采购资源" },
        { "role": "仓储方", "content": "检查库存并创建预留计划" },
        { "role": "物流方", "content": "生成交付与物流方案" },
        { "role": "客服方", "content": "生成客户沟通与进度通知" },
        { "role": "财务方", "content": "核算成本、利润与结算信息" }
    ],
    "aiReplies": [
        "好的！我会根据业务目标拆解需求，并协调相关资源与执行节点。",
        "业务方案已生成：\n\n📦 产品：新品 A\n📊 数量：500 件\n⏱️ 交付周期：7 天\n💰 预算：待确认",
        "资源匹配已完成：\n\n🏭 供应：已确认\n📦 库存：可用\n🚚 物流：方案已生成",
        "订单已进入执行流程，系统将持续跟踪任务状态、风险与交付进度。"
    ]
}

def format_time():
    return datetime.now().strftime("%H:%M:%S")

def run_simulation_thread(ws):
    try:
        # 1. Send USER_MESSAGE
        ws.send(json.dumps({
            "type": "USER_MESSAGE",
            "content": "需要处理一笔新品订单，数量500件，计划7天内完成交付",
            "timestamp": format_time()
        }))
        time.sleep(1.0)
        
        # 2. Send dispatch messages with 800ms interval
        for target in SIMULATION_CONFIG["dispatchTargets"]:
            ws.send(json.dumps({
                "type": "AI_DISPATCH_MESSAGE",
                "target_role": target["role"],
                "content": target["content"],
                "timestamp": format_time()
            }))
            time.sleep(0.8)
            
        # 3. Send final AI reply
        ws.send(json.dumps({
            "type": "AI_FINAL_REPLY",
            "content": SIMULATION_CONFIG["aiReplies"][1],
            "timestamp": format_time()
        }))
        time.sleep(1.0)
        
        # 4. Send simulation end
        ws.send(json.dumps({
            "type": "SIMULATION_END",
            "timestamp": format_time()
        }))
    except Exception as e:
        print(f"Simulation error: {e}")

@sock.route('/ws/monitor')
def ws_monitor(ws):
    """WebSocket endpoint for real-time frontend monitoring."""
    connected_clients.append(ws)
    try:
        while True:
            data = ws.receive()
            if data is None:
                break
            
            # Handle simulation request
            if data == 'START_SIMULATION':
                threading.Thread(target=run_simulation_thread, args=(ws,)).start()
                
            # Broadcast to all clients
            for client in connected_clients:
                if client != ws:
                    try:
                        client.send(data)
                    except:
                        pass
    except Exception as e:
        print(f"WebSocket Error: {e}")
    finally:
        if ws in connected_clients:
            connected_clients.remove(ws)

# =============================================================================
# Routes
# =============================================================================

@app.route("/")
def index():
    """Root redirect to H5 portal"""
    return redirect("/h5/")


@app.route("/index.html")
def index_page():
    """Serve index.html"""
    return send_from_directory(APP_DIR, 'index.html')


@app.route("/h5/")
def h5_index():
    """H5 portal index page - show company intro"""
    return render_template("company.html")


@app.route("/h5/company")
def h5_company():
    """Company intro page (explicit route)"""
    return render_template("company.html")


@app.route("/recruit")
def h5_recruit():
    """Recruitment page for international interns"""
    return render_template("recruit.html")


@app.route("/h5/orders")
def h5_orders():
    """Customer order list - demo page"""
    return render_template("h5_orders.html")


@app.route("/h5/entry")
def h5_entry():
    """H5 entry page"""
    return render_template("h5_entry.html")


@app.route("/img/<path:filename>")
def serve_images(filename):
    return send_from_directory(os.path.join(APP_DIR, 'images'), filename)


# =============================================================================
# API Endpoints
# =============================================================================

@app.route("/api/h5/orders")
def api_h5_orders():
    """API: Get customer orders (demo data)"""
    return jsonify({
        "success": True,
        "orders": [],
        "total": 0
    })


@app.route("/api/agent-flow/status")
def api_agent_flow_status():
    """API: Get agent flow status"""
    return jsonify({
        "success": True,
        "agents": [],
        "total": 0
    })


@app.route("/api/recruit/apply", methods=["POST"])
def api_recruit_apply():
    """API: Save FDE course applications from the recruitment page."""
    payload = request.get_json(silent=True) or {}
    required_fields = ("name", "phone", "identity")
    missing = [field for field in required_fields if not str(payload.get(field, "")).strip()]

    if missing:
        return jsonify({
            "success": False,
            "message": "请填写姓名、联系方式和当前身份。"
        }), 400

    if not payload.get("consent"):
        return jsonify({
            "success": False,
            "message": "请先勾选联系授权。"
        }), 400

    application = {
        "submitted_at": datetime.now().isoformat(timespec="seconds"),
        "name": str(payload.get("name", "")).strip()[:80],
        "phone": str(payload.get("phone", "")).strip()[:120],
        "identity": str(payload.get("identity", "")).strip()[:80],
        "city": str(payload.get("city", "")).strip()[:120],
        "goal": str(payload.get("goal", "")).strip()[:120],
        "message": str(payload.get("message", "")).strip()[:1000],
        "user_agent": request.headers.get("User-Agent", "")[:300],
        "remote_addr": request.headers.get("X-Forwarded-For", request.remote_addr or "").split(",")[0].strip()
    }

    os.makedirs(DATA_DIR, exist_ok=True)
    with open(APPLICATIONS_FILE, "a", encoding="utf-8") as file:
        file.write(json.dumps(application, ensure_ascii=False) + "\n")

    return jsonify({"success": True})


# =============================================================================
# Static Files & Agent Flow
# =============================================================================

@app.route("/agent-flow")
def agent_flow():
    """AI Agent Flow Monitor Page"""
    return render_template("agent_flow.html")


# =============================================================================
# Health Check
# =============================================================================

@app.route("/health")
def health():
    """Health check endpoint"""
    return jsonify({"status": "ok", "service": "h5_portal"})


# =============================================================================
# Main Entry
# =============================================================================

def run_h5_portal(host: str = "0.0.0.0", port: int = 8080, debug: bool = True):
    """Run H5 portal server"""
    print(f"\n🚀 H5 Portal Starting...")
    print(f"   Company: http://{host}:{port}/h5/")
    print(f"   Recruit: http://{host}:{port}/recruit")
    print(f"   Agent Flow: http://{host}:{port}/agent-flow")
    print(f"   Health: http://{host}:{port}/health\n")
    app.run(host=host, port=port, debug=debug)


if __name__ == "__main__":
    run_h5_portal()
