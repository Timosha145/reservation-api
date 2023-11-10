const app = Vue.createApp({
    data() {
        return {
            reservations: [],
            newReservation: {
                phoneNumber: '',
                name: '',
                time: '',
                service: '',
                carNumber: '',
            },
            editingReservation: null,
            isEditing: false,
            isAdmin: 0,
        };
    },
    async created() {
        await this.loadUser();
        this.reservations = await (await fetch('http://localhost:8080/reservations')).json();
    },
    methods: {
        async loadUser() {
            try {
                const response = await fetch('http://localhost:8080/get-user-info');
                if (response.ok) {
                    const userData = await response.json();
                    this.isAdmin = userData.isAdmin ? 1 : 0;
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
        addReservation: async function () {
            if (!this.newReservation.phoneNumber || !this.newReservation.name || !this.newReservation.time || !this.newReservation.service || !this.newReservation.carNumber) {
                alert('Please fill in all fields with valid data.');
                return;
            }

            try {
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
            this.isEditing = true;
        },
        cancelEdit() {
            this.editingReservation = null;
            this.isEditing = false;
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
    }
}).mount('#app');