const registrationApp = Vue.createApp({
    data() {
        return {
            id: '',
            name: '',
            email: '',
            password: '',
        };
    },
    created() {
        
    },
    methods: {
        async registerUser() {
            if (!this.name || !this.email || !this.password) {
                alert('Please fill in all fields.');
                return;
            }

            try {
                const response = await fetch('http://localhost:8080/get-last-user');
                const lastUser = await response.json();
                
                this.id = lastUser ? lastUser.id + 1 : 1;

                const registerResponse = await fetch('http://localhost:8080/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        id: this.id,
                        name: this.name,
                        email: this.email,
                        password: this.password,
                    }),
                });

                if (registerResponse.ok) {
                    alert('Registration successful. You can now login.');
                    window.location.href = 'login.html';
                } else {
                    const data = await registerResponse.json();
                    alert(`Registration failed: ${data.error}`);
                }
            } catch (error) {
                console.error('Registration error:', error);
            }
        }
    }
});

registrationApp.mount('#registration-app');
