const app = Vue.createApp({
    data() {
        return {
            reservations: [],
            services: [],
            newReservation: {
                phoneNumber: '',
                name: '',
                time: '',
                salon: '',
                service: '',
                carNumber: '',
            },
            newService: {
                id: '',
                name: '',
                price: '1',
                description: '',
                duration: ''
            },
            editingReservation: null,
            editingService: null,
            isEditing: false,
            isAdmin: 0,
            userId: null
        };
    },
    async mounted() {
        await this.loadUser();
        this.reservations = await (await fetch('http://localhost:8080/reservations')).json();
        this.services = await (await fetch('http://localhost:8080/services')).json();
    },
    methods: {
        async loadUser() {
            try {
                const response = await fetch('http://localhost:8080/get-user-info');
                if (response.ok) {
                    const userData = await response.json();
                    this.isAdmin = userData.isAdmin ? 1 : 0;
                    this.userId = userData.id;
                    this.newReservation.name = userData.name;
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
        deleteService: async function (id) {
            const serviceToDelete = this.services.find(service => service.id === id);
            if (!serviceToDelete) {
                console.error('Service was not found:', id);
                return;
            }

            try {
                await fetch(`http://localhost:8080/services/${id}`, {
                    method: 'DELETE'
                });
                this.services = this.services.filter(service => service.id !== id);
            } catch (error) {
                console.error('Couldnt delete a service:', error);
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
        async addService() {
            if (!this.newService.name || !this.newService.price || !this.newService.description || !this.newService.duration) {
                alert('Please fill in all fields with valid data.');
                return;
            }

            try {
                const response = await fetch('http://localhost:8080/services', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(this.newService)
                });

                if (response.ok) {
                    const newService = await response.json();
                    this.services.push(newService);
                    this.newService = {
                        name: '',
                        price: '',
                        description: '',
                        duration: '',
                    };
                }
            } catch (error) {
                console.error('Unable to add a new service:', error);
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
        editService(service) {
            this.editingService = { ...service };
            this.isEditing = true;
        },
        cancelEdit() {
            this.editingReservation = null;
            this.isEditing = false;
        },
        cancelEditService() {
            this.editingService = null;
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
        async saveEditService(service) {
            try {
                const response = await fetch(`http://localhost:8080/services/${service.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(this.editingService)
                });

                if (response.ok) {
                    const updatedService = await response.json();
                    const index = this.services.findIndex(r => r.id === service.id);
                    if (index !== -1) {
                        this.services[index] = updatedService;
                    }

                    this.isEditing = false;
                    this.editingService = null;
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
        async goToServices() {
            window.location.href='services.html';
        },
        async goToIndex() {
            window.location.href='index.html';
        },
    }
}).mount('#app');