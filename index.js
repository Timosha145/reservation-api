const express = require('express');
const app = express();
const port = 8080;
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const yamls = require('yamljs');
const swaggerDocument = yamls.load('./docs/swagger.yaml');

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

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
