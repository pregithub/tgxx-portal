document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('fdeApplyForm');
    const status = document.getElementById('formStatus');

    if (!form || !status) {
        return;
    }

    form.addEventListener('submit', async function(event) {
        event.preventDefault();
        status.textContent = '正在提交，请稍候...';
        status.className = 'form-status';

        const formData = new FormData(form);
        const payload = Object.fromEntries(formData.entries());
        payload.consent = formData.get('consent') === 'on';

        try {
            const response = await fetch('/api/recruit/apply', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || '提交失败，请稍后再试');
            }

            form.reset();
            status.textContent = '报名信息已提交成功，项目组会尽快联系你。';
            status.className = 'form-status success';
        } catch (error) {
            status.textContent = error.message || '提交失败，请稍后再试。';
            status.className = 'form-status error';
        }
    });
});
