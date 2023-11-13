const app = Vue.createApp({
    data() {
        return {
            reservations: [],
            newReservation: {
                phoneNumber: '',
                name: 'фцв',
                time: '',
                salon: '',
                service: '',
                carNumber: '',
            },
            services: [],
            editingReservation: null,
            isEditing: false,
            isAdmin: 0,
            userId: null,
            userName: null
        };
    },
    async mounted() {
        await this.loadServices();
        await this.loadUser();
        //this.newReservation.name = this.userName;
        this.reservations = await (await fetch('http://localhost:8080/reservations')).json();
    },
    methods: {
        async loadUser() {
            try {
                const response = await fetch('http://localhost:8080/get-user-info');
                if (response.ok) {
                    const userData = await response.json();
                    this.isAdmin = userData.isAdmin ? 1 : 0;
                    this.userId = userData.id;
                    userName = this.userName;
                } else {
                    console.error('Error loading user data:', response.statusText);
                }
            } catch (error) {
                console.error('Error loading user data:', error);
            }
        },
        deleteReservation: async function (id) {
            const reservationToDelete = this.reservations.find(reservation => reservation.id === id);
            if (!reservationToDelete) {
                console.error('Reservation was not found:', id);
                return;
            }
        
            try {
                await fetch(`http://localhost:8080/reservations/${id}`, {
                    method: 'DELETE'
                });
                this.reservations = this.reservations.filter(reservation => reservation.id !== id);
            } catch (error) {
                console.error('Couldnt delete a reservation:', error);
            }
        },
        async addReservation() {
            if (!this.newReservation.phoneNumber || !this.newReservation.name || !this.newReservation.time || !this.newReservation.salon || !this.newReservation.service || !this.newReservation.carNumber) {
                alert('Please fill in all fields with valid data.');
                return;
            }
        
            try {
                const selectedService = this.services.find(service => service.name === this.newReservation.service);
                if (!selectedService) {
                    console.error('Selected service not found:', this.newReservation.service);
                    return;
                }
        
                this.newReservation.service = selectedService;
        
                const response = await fetch('http://localhost:8080/reservations', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(this.newReservation)
                });
        
                if (response.ok) {
                    const newReservation = await response.json();
                    this.reservations.push(newReservation);
                    this.newReservation = {
                        phoneNumber: '',
                        name: '',
                        time: '',
                        salon: '',
                        service: '',
                        carNumber: ''
                    };
                }
            } catch (error) {
                console.error('Unable to add a new reservation:', error);
            }
        },
        editReservation(reservation) {
            this.editingReservation = { ...reservation };
            const selectedService = this.services.find(service => service.name == this.editingReservation.service.name);
        
            if (selectedService) {
                this.editingReservation.service = selectedService;
            } else {
                console.error('Selected service not found:', this.editingReservation.service);
            }
        
            this.isEditing = true;
        },
        cancelEdit() {
            this.editingReservation = null;
            this.isEditing = false;
        },
        async saveEdit(reservation) {
            try {
                const response = await fetch(`http://localhost:8080/reservations/${reservation.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(this.editingReservation)
                });
        
                if (response.ok) {
                    const updatedReservation = await response.json();
                    const index = this.reservations.findIndex(r => r.id === reservation.id);
                    if (index !== -1) {
                        this.reservations[index] = updatedReservation;
                    }
        
                    this.isEditing = false;
                    this.editingReservation = null;
                }
            } catch (error) {
                console.error('Unable to save edit:', error);
            }
        },
        async logout() {
            try {
                const response = await fetch('http://localhost:8080/logout', {
                    method: 'POST',
                });

                if (response.ok) {
                    window.location.href = 'login.html';
                } else {
                    console.error('Error logging out:', response.statusText);
                }
            } catch (error) {
                console.error('Error logging out:', error);
            }
        },
        async loadServices() {
            try {
                const response = await fetch('services.json');
                if (response.ok) {
                    this.services = await response.json();
                } else {
                    console.error('Error loading services:', response.statusText);
                }
            } catch (error) {
                console.error('Error loading services:', error);
            }
        }
    }
}).mount('#app');