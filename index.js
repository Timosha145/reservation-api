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

let users = [];
try {
    const usersData = fs.readFileSync('users.json');
    users = JSON.parse(usersData);
} catch (error) {
    console.error('Error loading users:', error);
}

app.get('/check-login', (req, res) => {
    if (req.session.user) {
        res.status(200).json({
            isLoggedIn: true,
            user: req.session.user,
        });
    } else {
        res.status(200).json({
            isLoggedIn: false,
            user: null,
        });
    }
});

app.post('/register', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).send({ error: 'Both username and password are required' });
    }

    if (users.find(user => user.username === username)) {
        return res.status(409).send({ error: 'Username already exists' });
    }

    const newUser = { username, password, permissions: 0 };
    users.push(newUser);

    fs.writeFileSync('users.json', JSON.stringify(users, null, 2));

    req.session.user = { username, permissions: 0 };

    res.status(201).send({ message: 'Registration successful', user: newUser });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).send({ error: 'Both username and password are required' });
    }

    const user = users.find(user => user.username === username && user.password === password);

    if (!user) {
        return res.status(401).send({ error: 'Invalid username or password' });
    }

    req.session.user = { username, isAdmin: user.permissions };

    res.send({ message: 'Login successful', user });
});

app.get('/get-user-info', (req, res) => {
    if (req.session.user) {
        const userInfo = {
            username: req.session.user.username,
            isAdmin: req.session.user.isAdmin || 0,
        };
        res.status(200).json(userInfo);
    } else {
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

const reservations = [
    {
        "id": "1",
        "phoneNumber": "+37245678988",
        "name": "Boris Borisov",
        "time": "2023-10-11 12:34",
        "service": "Service A",
        "carNumber": "101BYN"
    },
    {
        "id": "2",
        "phoneNumber": "+37278915798",
        "name": "Renat Renatov",
        "time": "2023-09-21 13:36",
        "service": "Service B",
        "carNumber": "899RTY"
    },
    {
        "id": "3",
        "phoneNumber": "+37212345678",
        "name": "Alice Johnson",
        "time": "2023-09-15 10:15",
        "service": "Service A",
        "carNumber": "ABC123"
    },
    {
        "id": "4",
        "phoneNumber": "+37298765432",
        "name": "John Doe",
        "time": "2023-08-30 16:45",
        "service": "Service B",
        "carNumber": "XYZ789"
    },
    {
        "id": "5",
        "phoneNumber": "+37255556666",
        "name": "Emily Smith",
        "time": "2023-08-25 14:20",
        "service": "Service A",
        "carNumber": "777PPP"
    },
    {
        "id": "6",
        "phoneNumber": "+37233334444",
        "name": "Maria Garcia",
        "time": "2023-08-14 09:30",
        "service": "Service B",
        "carNumber": "222BBB"
    },
    {
        "id": "7",
        "phoneNumber": "+37288889999",
        "name": "Michael Brown",
        "time": "2023-08-10 11:55",
        "service": "Service A",
        "carNumber": "555JJJ"
    },
    {
        "id": "8",
        "phoneNumber": "+37266667777",
        "name": "Sophia Taylor",
        "time": "2023-07-29 15:10",
        "service": "Service B",
        "carNumber": "999ZZZ"
    }
];

app.get('/reservations', (req, res) => {
    res.send(reservations);
});

app.get('/reservations/:id', (req, res) => {
    const reservation = reservations.find(r => r.id === req.params.id);

    if (!reservation) {
        return res.status(404).send({ error: "Reservation not found" });
    }

    res.send(reservation);
});

app.post('/reservations', (req, res) => {
    if (!req.body.phoneNumber || !req.body.name || !req.body.time || !req.body.service || !req.body.carNumber) {
        return res.status(400).send({ error: 'One or all params are missing' });
    }

    const newId = (parseInt(reservations[reservations.length - 1].id) + 1).toString();

    const reservation = {
        id: newId,
        phoneNumber: req.body.phoneNumber,
        name: req.body.name,
        time: req.body.time,
        service: req.body.service,
        carNumber: req.body.carNumber
    };

    reservations.push(reservation);

    res.status(201)
        .location(`${getBaseUrl(req)}/reservations/${newId}`)
        .send(reservation);
});

app.delete('/reservations/:id', (req, res) => {
    const index = reservations.findIndex(r => r.id === req.params.id);

    if (index === -1) {
        return res.status(404).send({ error: "Reservation not found" });
    }

    reservations.splice(index, 1);

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

app.put('/reservations/:id', (req, res) => {
    const id = req.params.id;
    const updatedReservation = req.body;

    if (!updatedReservation.phoneNumber || !updatedReservation.name || !updatedReservation.time || !updatedReservation.service || !updatedReservation.carNumber) {
        return res.status(400).send({ error: 'One or all params are missing' });
    }

    const index = reservations.findIndex(r => r.id === id);

    if (index === -1) {
        return res.status(404).send({ error: "Reservation not found" });
    }

    reservations[index] = {
        id: id,
        phoneNumber: updatedReservation.phoneNumber,
        name: updatedReservation.name,
        time: updatedReservation.time,
        service: updatedReservation.service,
        carNumber: updatedReservation.carNumber
    };

    res.send(reservations[index]);
});