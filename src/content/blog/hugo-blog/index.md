---
title: "Hugo博客建站记录"
description: "记录使用 Hugo + PaperMod 搭建博客、配置部署和 HTTPS 的过程。"
createdAt: "2026-02-07"
published: true
---

本篇仅记录主包建hugo博客的过程, 大量内容由AI生成, 不保证适用

---

## 本地配置

安装Hugo
```bash
sudo dnf install hugo
```

某些主题(如主包使用的Papermod)需要下载 Extended 版渲染 SCSS
可以通过 `hugo version` 检查版本
如果需要 Extended 版且 `dnf` 不行, 可以考虑在[Hugo Github Release](https://github.com/gohugoio/hugo/releases) 下载二进制文件

在博客文件夹内创建项目并初始化
```bash
hugo new site my_blog
cd my_blog
git init
```

安装主题, 主包选了Papermod
在项目目录里执行
```bash
# 添加 PaperMod 仓库到 themes 文件夹
git submodule add --depth=1 https://github.com/adityatelange/hugo-PaperMod.git themes/PaperMod
```

---

此时遇到了DNS解析失败的问题, 主包系统是Fedora43, 使用 NetworkManager 管理网络
因此可以直接给当前的连接指定 DNS

查看当前连接
```bash
nmcli connection show
```

设置DNS
```bash
sudo nmcli connection modify "你的连接名" ipv4.dns "8.8.8.8 1.1.1.1"
sudo nmcli connection modify "你的连接名" ipv4.ignore-auto-dns yes
```

激活配置
```bash
sudo nmcli connection up "你的连接名"
```

现在能正常下载了

---

回到主题, 修改主题的配置文件 `hugo.toml`
在尾部加上一行
```toml
theme = 'PaperMod'
```

Github创建仓库
本地关联并推送
```bash
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/你的用户名/my_blog.git
git push -u origin main
```

---

## 服务器端配置

主包打算把文件放在用户文件夹下
创建目录
```bash
mkdir -p ~/hugo_blog/public
cd ~/hugo_blog
```

编写`docker-compose.yml`
```yaml
services:
  hugo_nginx:
    image: nginx:alpine
    container_name: hugo_blog
    restart: always
    ports:
      - "80:80"
    volumes:
      # 将当前目录下的 public 映射到 Nginx 的网页根目录
      - ./public:/usr/share/nginx/html:ro
```

启动容器
```bash
docker-compose up -d
```
此时因为 `public` 文件夹是空的，访问会报 403，这是正常的

---

主包此时遇到了用户权限不足的问题(因为主包没用sudo登陆), 需要将用户加入Docker组

创建 docker 组
```bash
sudo groupadd docker
```

将当前用户加入该组
```bash
sudo usermod -aG docker $USER
```

激活更改
```bash
newgrp docker
```

草, 整到一半被同学拉去启动MC了, 回来接着整

---

## 配置 Github Actions

生成本地SSH密钥对 (为了使github action能访问服务器)
```bash
ssh-keygen -t rsa -b 4096 -f ./id_rsa_hugo
```

把公钥加到服务器的`~/.ssh/authorized_keys`里

在GitHub Repository Settings -> Secrets and variables -> Actions
添加一个名为 `SERVER_SSH_KEY` 的 Secret, 里面粘贴私钥
同时添加以下 Secrets
- `SERVER_IP`: 服务器 IP
- `SERVER_USER`: 登录用户名

创建Actions脚本
在本地根目录创建 `.github/workflows/deploy.yml`
```yaml
name: Deploy Hugo Site

on:
  push:
    branches:
      - main  # 每次推送到 main 分支时触发

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          submodules: recursive  # 确保拉取主题

      - name: Setup Hugo
        uses: peaceiris/actions-hugo@v3
        with:
          hugo-version: 'latest'
          extended: true

      - name: Build
        run: hugo --minify

      - name: Deploy to Server
        uses: easingthemes/ssh-deploy@main
        env:
          SSH_PRIVATE_KEY: ${{ secrets.SERVER_SSH_KEY }}
          ARGS: "-avz --delete"
          SOURCE: "public/"
          REMOTE_HOST: ${{ secrets.SERVER_IP }}
          REMOTE_USER: ${{ secrets.SERVER_USER }}
          TARGET: "/你/的/路/径" # 对应 docker-compose 挂载的目录
```
**最后一行的TARGET取决于docker_compose的位置, 需要修改**

---

之后就是在京东给域名报备了, 应该得等几天

上午申请的, 怎么晚上就通过了, 这么快

域名买了`0-range.cn`, 虽然三年一百多有点贵, 但和某些第一年十几块, 续费五六十的域名相比还是太良心了

确认域名后, 需要修改 `hugo.toml` 中的 `BaseURL`, 例如
```toml
baseURL = 'https://0-range.cn/' # 修改为你的域名, 前缀用https
```

---

## 配置 Nginx 反向代理与 HTTPS

修改 `docker-compose.yml`, 添加反向代理
同时启动nginx-proxy-manager
```yaml
services:
  hugo_server:
    image: nginx:alpine
    container_name: hugo_blog
    restart: always
    expose:
      - "80"
    volumes:
      - ./public:/usr/share/nginx/html:ro
    networks:
      - blog_net

  npm:
    image: 'jc21/nginx-proxy-manager:latest'
    container_name: npm
    restart: always
    ports:
      - '80:80'
      - '443:443'
      - '81:81'
    volumes:
      - ./data:/data
      - ./letsencrypt:/etc/letsencrypt
    networks:
      - blog_net

networks:
  blog_net:
    driver: bridge
```

查看当前运行的容器
```bash
docker ps
```
在启动新配置前，必须先释放原有的 80 端口
停止并删除旧容器
```bash
docker stop hugo_blog
docker rm hugo_blog
```

在 `docker-compose.yml`所在目录, 启动新架构
```bash
docker-compose up -d
```

---

## 图形化配置域名

先在京东后台开放81端口
添加 **“入站规则”**：
- **协议**：TCP
- **端口范围**：`81`
- **授权对象**：`0.0.0.0/0`(代表允许所有人访问, 建议改成自己IP)

做到这步时主包发现自己之前只是实名而非报备, 报备要求实名日期 >= 3天, 只能等了

---

实名等3天, 报备等了整整18天, 果然年前报备不是个好主意

报备后访问 `http://服务器IP:81`, 进入 `Nginx Proxy Manager` 登陆界面

默认账号密码如下, 系统会强制要求修改用户名和密码
- Email: admin@example.com
- Password: changeme

进入管理面板后, 我们添加一条Proxy Host, 让域名指向服务
在导航栏选择 `Hosts`-`Proxy Hosts`, 点击右侧的 `Add Proxy Host`

- `Domain Names`: 填写域名, 不需要www前缀, 记得区分大小写
- `Scheme`: 内部通信, 故选http
- `Forward Hostname`, `Forward Port`: 和 `docker-compose.yml` 保持一致即可, 主包这里分别填了 `hugo_blog` 和 `80`
- `Cache Assets`: 能减轻后端负担, 但容易导致更新延迟, 建议在网站稳定运行后打开
- `Block Common Exploits`: 阻挡常见攻击, 建议打开
- `Websockets Support`: 如果博客需要评论or实时功能则开启, 考虑到占用资源不多, 建议打开
**这里的设置都可以随时调整, 因此无需担心填错**

---

## 配置SSL

在京东后台开放80, 443端口, 步骤和刚才开放81一样
80(http), 443(https)本来就是给公众访问用的, 因此可以放心开

申请SSL证书时, 验证过程用到80, 443端口
故需要在VPS确认80端口没被占用
```bash
sudo ss -tunlp | grep :80
sudo ss -tunlp | grep :443
```

如果返回除了NPM外为空, 说明端口是干净的, 可以申请SSL证书

---

回到 `http://服务器IP:81`, 在刚才创建的 `Proxy Host` 点击右侧三个点-`edit`, 选择 `SSL` 选项卡
- `SSL Certificate`: 选择 `Request a new Certificate`
- 打开 `Force SSL`, `HTTP/2 Support`
之后点击Save, 开始申请. 申请过程可能持续 1-2 分钟

---

现在可以访问Hugo博客喵
