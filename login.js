const loginApp = Vue.createApp({
    data() {
        return {
            email: '',
            password: ''
        };
    },
    methods: {
        async loginUser() {
            if (!this.email || !this.password) {
                alert('Please fill in both email and password.');
                return;
            }

            try {
                const response = await fetch('http://localhost:8080/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: this.email,
                        password: this.password,
                    }),
                });

                if (response.ok) {
                    alert('Login successful.');
                    window.location.href = 'index.html';
                } else {
                    const data = await response.json();
                    alert(`Login failed: ${data.error}`);
                }
            } catch (error) {
                console.error('Login error:', error);
            }
        },
    },
});

loginApp.mount('#login-app');

function copyToClipboard(text) {
      var input = document.createElement('input');
      input.setAttribute('value', text);
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
}
