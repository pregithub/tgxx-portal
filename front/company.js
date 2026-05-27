// 天工智序软件科技 - 公司介绍页面脚本

document.addEventListener('DOMContentLoaded', function() {
    // 导航栏滚动效果
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // 移动端菜单
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');

    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', function() {
            mobileMenu.classList.toggle('active');
        });

        // 点击链接后关闭菜单
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', function() {
                mobileMenu.classList.remove('active');
            });
        });
    }

    // 平滑滚动
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // 提示词折叠展示
    document.querySelectorAll('.prompt-toggle').forEach(toggle => {
        toggle.addEventListener('click', function() {
            const prompt = this.closest('.case-prompt');
            prompt.classList.toggle('active');
        });
    });

    // 视差效果和动画
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    // 为卡片添加动画类
    document.querySelectorAll('.vision-card, .feature-item, .team-card, .advantage-item').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.6s ease';
        observer.observe(el);
    });

    // 添加visible类时的样式
    const style = document.createElement('style');
    style.textContent = `
        .visible {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
    `;
    document.head.appendChild(style);

    // 数字滚动动画
    const statNumbers = document.querySelectorAll('.stat-number');
    statNumbers.forEach(num => {
        const target = num.textContent.trim();
        const numMatch = target.match(/\d+(\.\d+)?/);
        if (!numMatch || numMatch.index !== 0) {
            // 非数字开头的表达（如“近20年”“双闭环”）保持原文本，避免动画过程破坏语义。
            return;
        }

        const targetNum = parseFloat(numMatch[0]);
        const prefix = target.substring(0, numMatch.index);
        const suffix = target.substring(numMatch.index + numMatch[0].length);

        let current = 0;
        const duration = 2000;
        const step = targetNum / (duration / 16);

        const animate = () => {
            current += step;
            if (current >= targetNum) {
                current = targetNum;
                num.textContent = target;
            } else {
                const displayVal = Number.isInteger(targetNum) ? Math.floor(current) : current.toFixed(1);
                num.textContent = prefix + displayVal + suffix;
                requestAnimationFrame(animate);
            }
        };

        // 只在视口中时触发动画
        const numObserver = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animate();
                    numObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        numObserver.observe(num);
    });
});
