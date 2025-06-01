// servidor.js
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();

const mongoURL = 'mongodb://127.0.0.1:27017/database';

// Configuración motor de vistas EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Definición esquema y modelo de MongoDB
const visitaSchema = new mongoose.Schema({
  ip: { type: String, required: true, unique: true },
  fecha: { type: Date, default: Date.now },
  conteo: { type: Number, default: 1 },
});

const Visita = mongoose.model('Visita', visitaSchema);

// Conectar a MongoDB
mongoose.connect(mongoURL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Conectado a MongoDB'))
.catch(err => console.error('Error al conectar a MongoDB:', err));

// Ruta principal
app.get('/', async (req, res) => {
  try {
    const ipCliente = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    const ipLimpia = ipCliente.replace(/^.*:/, ''); // Limpia prefijos IPv6 ::ffff:

    let visita = await Visita.findOne({ ip: ipLimpia });

    if (!visita) {
      visita = new Visita({ ip: ipLimpia });
      await visita.save();
      return res.render('index', {
        mensaje: `Hola, primera vez por aquí, IP: ${ipLimpia}`,
        conteo: visita.conteo,
        esNuevo: true,
      });
    } else {
      visita.conteo += 1;
      visita.fecha = new Date();
      await visita.save();

      return res.render('index', {
        mensaje: `Hola, volviste de nuevo, IP: ${ipLimpia}`,
        conteo: visita.conteo,
        esNuevo: false,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Error interno del servidor');
  }
});

// Puerto y escucha
const PUERTO = 80;
const IP_LOCAL = '127.0.0.1';

app.listen(PUERTO, IP_LOCAL, () => {
  console.log(`Servidor corriendo en http://${IP_LOCAL}:${PUERTO}`);
});
