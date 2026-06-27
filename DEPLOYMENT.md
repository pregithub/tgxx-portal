# 阿里云自动部署

本项目使用 GitHub Actions 在 `main` 分支 Push 后自动完成：代码检查 → SSH 登录阿里云 → 更新到本次提交 → 安装依赖 → 重启 systemd 服务 → `/health` 健康检查。

## 1. 首次初始化阿里云服务器

服务器需已安装 Git、Python 3（含 `venv`）和 systemd。将仓库中的 `deploy` 目录放到服务器，或先手动克隆仓库，然后执行：

```bash
chmod +x deploy/bootstrap-aliyun.sh deploy/remote-deploy.sh
./deploy/bootstrap-aliyun.sh \
  https://github.com/pregithub/nexsky-apph5.git \
  /opt/tgxx-portal \
  main \
  tgxx-portal
```

脚本会创建 Python 虚拟环境、生成 `.env` 中的随机 `APP_SECRET_KEY`，并安装、启动 `tgxx-portal.service`。应用默认只监听 `127.0.0.1:8080`，建议由 Nginx/Caddy 负责 HTTPS 和反向代理。

部署用户还需能够无密码重启这个服务。非 root 用户可通过 `sudo visudo` 添加一条最小权限规则（将 `deploy` 替换成实际用户）：

```text
deploy ALL=(root) NOPASSWD: /usr/bin/systemctl restart tgxx-portal.service, /usr/bin/systemctl is-active tgxx-portal.service, /usr/bin/systemctl status tgxx-portal.service
```

## 2. 创建部署专用 SSH 密钥

在可信电脑生成密钥，不要设置口令：

```bash
ssh-keygen -t ed25519 -C "github-actions-tgxx" -f ./tgxx_deploy_key -N ""
```

将公钥 `tgxx_deploy_key.pub` 追加到服务器部署用户的 `~/.ssh/authorized_keys`。私钥内容只放入 GitHub Secret。

## 3. 配置 GitHub Environment Secrets

进入仓库 `Settings → Environments → New environment`，创建 `production`，然后添加：

| Secret | 示例/说明 |
| --- | --- |
| `ALIYUN_HOST` | 阿里云公网 IP 或域名 |
| `ALIYUN_SSH_PORT` | SSH 端口，通常为 `22`；留空也默认 22 |
| `ALIYUN_USER` | 服务器部署用户，如 `deploy` |
| `ALIYUN_SSH_PRIVATE_KEY` | `tgxx_deploy_key` 私钥完整内容 |
| `ALIYUN_SSH_KNOWN_HOSTS` | `ssh-keyscan -p 22 <服务器地址>` 的完整输出 |
| `ALIYUN_DEPLOY_PATH` | `/opt/tgxx-portal` |
| `ALIYUN_SERVICE_NAME` | `tgxx-portal`；留空也使用此名称 |

建议给 `production` Environment 开启 required reviewers，以便首次上线时人工确认；后续若要全自动，可关闭审批规则。

## 4. 触发和排错

- Push 到 `main` 会自动部署。
- `Actions → Deploy to Aliyun → Run workflow` 可手动重跑。
- 工作流只接受 fast-forward 更新；若服务器仓库存在已跟踪文件的本地修改，会安全退出，不会覆盖。
- 查看服务器日志：

```bash
sudo systemctl status tgxx-portal --no-pager
sudo journalctl -u tgxx-portal -n 100 --no-pager
```

如果仓库是私有仓库，还需给服务器配置只读 GitHub Deploy Key，确保服务器上的 `git fetch origin main` 有权限。
