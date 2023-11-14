const express = require('express');
const app = express();
const port = 8080;
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const yamls = require('yamljs');
const swaggerDocument = yamls.load('./docs/swagger.yaml');
const session = require('express-session');
const fs = require('fs');

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
}));

let services = [];
try {
    const servicesData = fs.readFileSync('services.json');
    services = JSON.parse(servicesData);
} catch (error) {
    console.error('Error loading services:', error);
}

let users = [];
try {
    const usersData = fs.readFileSync('users.json');
    users = JSON.parse(usersData);
} catch (error) {
    console.error('Error loading users:', error);
}

let reservations = [];
try {
    const reservationsData = fs.readFileSync('reservations.json');
    reservations = JSON.parse(reservationsData);
} catch (error) {
    console.error('Error loading reservations:', error);
}

app.get('/check-login', (req, res) => {
    if (req.session.user) {
        res.status(200).json({
            isLoggedIn: true,
            user: req.session.user,
            isAdmin: req.session.user.isAdmin || 0,
        });
    } else {
        res.status(200).json({
            isLoggedIn: false,
            user: null,
        });
    }
});

app.get('/get-last-user', (req, res) => {
    const lastUser = getLastUser();
    
    if (lastUser) {
        res.status(200).json(lastUser);
    } else {
        res.status(404).json({ error: 'No users found' });
    }
});

app.post('/register', (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).send({ error: 'Name, email, and password are required' });
    }

    if (users.find(user => user.email === email)) {
        return res.status(409).send({ error: 'This email has been already taken' });
    }

    const newUser = { id: getNextUserId(), name, email, password, permissions: 0 };
    users.push(newUser);

    fs.writeFileSync('users.json', JSON.stringify(users, null, 2));

    req.session.user = { id: newUser.id, name: newUser.name, permissions: 0 };

    res.status(201).send({ message: 'Registration successful', user: newUser });
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).send({ error: 'Both email and password are required' });
    }

    const user = users.find(user => user.email === email && user.password === password);

    if (!user) {
        return res.status(401).send({ error: 'Invalid email or password' });
    }

    req.session.user = { id: user.id, name: user.name, email: user.email, isAdmin: user.permissions };

    res.send({ message: 'Login successful', user });
});

app.get('/get-user-info', (req, res) => {
    if (req.session.user) {
        const userInfo = {
            id: req.session.user.id,
            name: req.session.user.name,
            email: req.session.user.email,
            isAdmin: req.session.user.isAdmin || 0,
        };
        res.status(200).json(userInfo);
    } else {
        window.location.href = 'login.html';
        res.status(401).send({ error: 'User not authenticated' });
    }
});

app.post('/logout', (req, res) => {
    req.session.destroy();
    res.send({ message: 'Logout successful' });
});

app.use((req, res, next) => {
    if (!req.session.user) {
        return res.status(401).send({ error: 'Unauthorized' });
    }
    next();
});

app.get('/reservations', (req, res) => {
    const userReservations = reservations;

    res.send(userReservations);
});

app.get('/reservations/:id', (req, res) => {
    const reservation = reservations.find(r => r.id === req.params.id);

    if (!reservation) {
        return res.status(404).send({ error: "Reservation not found" });
    }

    if (!req.session.user.isAdmin && reservation.username !== req.session.user.username) {
        return res.status(403).send({ error: "Access forbidden" });
    }

    res.send(reservation);
});

app.post('/reservations', (req, res) => {
    if (!req.body.phoneNumber || !req.body.name || !req.body.time || !req.body.salon || !req.body.service || !req.body.carNumber) {
        return res.status(400).send({ error: 'One or all params are missing' });
    }

    const newId = (parseInt(reservations[reservations.length - 1].id) + 1).toString();

    const reservation = {
        id: newId,
        clientId: req.session.user.id,
        username: req.session.user.username,
        phoneNumber: req.body.phoneNumber,
        name: req.body.name,
        time: req.body.time,
        salon: req.body.salon,
        service: req.body.service,
        carNumber: req.body.carNumber
    };

    reservations.push(reservation);

    res.status(201)
        .location(`${getBaseUrl(req)}/reservations/${newId}`)
        .send(reservation);
});

app.delete('/reservations/:id', (req, res) => {
    const id = req.params.id;
    const index = reservations.findIndex(r => r.id === id);

    if (index === -1) {
        return res.status(404).send({ error: "Reservation not found" });
    }

    if (!req.session.user.isAdmin && reservations[index].username !== req.session.user.username) {
        return res.status(403).send({ error: "Access forbidden" });
    }

    reservations.splice(index, 1);

    res.status(204).send();
});

app.put('/reservations/:id', (req, res) => {
    const id = req.params.id;
    const updatedReservation = req.body;

    if (!updatedReservation.phoneNumber || !updatedReservation.name || !updatedReservation.time || !updatedReservation.salon || !updatedReservation.service || !updatedReservation.carNumber) {
        return res.status(400).send({ error: 'One or all params are missing' });
    }

    const index = reservations.findIndex(r => r.id === id);

    if (index === -1) {
        return res.status(404).send({ error: "Reservation not found" });
    }

    if (!req.session.user.isAdmin && reservations[index].username !== req.session.user.username) {
        return res.status(403).send({ error: "Access forbidden" });
    }

    reservations[index] = {
        id: id,
        clientId: req.session.user.id,
        username: req.session.user.username,
        phoneNumber: updatedReservation.phoneNumber,
        name: updatedReservation.name,
        time: updatedReservation.time,
        salon: updatedReservation.salon,
        service: updatedReservation.service,
        carNumber: updatedReservation.carNumber
    };

    res.send(reservations[index]);
});

app.get('/services', (req, res) => {
    res.send(services);
});

app.get('/services/:id', (req, res) => {
    const service = services.find(s => s.id === req.params.id);

    if (!service) {
        return res.status(404).send({ error: "Service not found" });
    }

    res.send(service);
});

app.post('/services', (req, res) => {
    const { name, price, description, duration } = req.body;

    if (!name || !price || !description || !duration) {
        return res.status(400).send({ error: 'One or all params are missing' });
    }

    const newId = (parseInt(services[services.length - 1].id) + 1).toString();

    const newService = {
        id: newId,
        name,
        price,
        description,
        duration,
    };

    services.push(newService);

    fs.writeFileSync('services.json', JSON.stringify(services, null, 2));

    res.status(201)
        .location(`${getBaseUrl(req)}/services/${newId}`)
        .send(newService);
});

app.put('/services/:id', (req, res) => {
    const id = req.params.id;
    const updatedService = req.body;

    if (!updatedService.name || !updatedService.price || !updatedService.description || !updatedService.duration) {
        return res.status(400).send({ error: 'One or all params are missing' });
    }

    const index = services.findIndex(s => s.id === id);

    if (index === -1) {
        return res.status(404).send({ error: "Service not found" });
    }

    services[index] = {
        id: id,
        name: updatedService.name,
        price: updatedService.price,
        description: updatedService.description,
        duration: updatedService.duration,
    };

    fs.writeFileSync('services.json', JSON.stringify(services, null, 2));

    res.send(services[index]);
});

app.delete('/services/:id', (req, res) => {
    const id = req.params.id;
    const index = services.findIndex(s => s.id === id);

    if (index === -1) {
        return res.status(404).send({ error: "Service not found" });
    }

    services.splice(index, 1);

    fs.writeFileSync('services.json', JSON.stringify(services, null, 2));

    res.status(204).send();
});

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.listen(port, () => {
    console.log(`API up at: http://localhost:${port}`);
});

function getBaseUrl(req) {
    return req.connection && req.connection.encrypted
        ? 'https' : 'http' + `://${req.headers.host}`;
}

function getNextUserId() {
    const lastUser = getLastUser();
    return lastUser ? lastUser.id + 1 : 1;
}

function getLastUser() {
    try {
        const usersData = fs.readFileSync('users.json');
        const users = JSON.parse(usersData);

        if (users.length > 0) {
            return users[users.length - 1];
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error getting last user:', error);
        return null;
    }
}