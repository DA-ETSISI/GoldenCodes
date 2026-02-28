import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Participante from '#models/participante'

export default class extends BaseSeeder {
  async run() {
    const pdiNames = [
      // 1º
      { name: 'Ana Martínez', cat: 'Primer curso (Grados)' },
      { name: 'Carlos Gómez', cat: 'Primer curso (Grados)' },
      { name: 'Elena Rodríguez', cat: 'Primer curso (Grados)' },
      { name: 'David Fernández', cat: 'Primer curso (Grados)' },
      // 2º
      { name: 'Laura Sánchez', cat: 'Segundo curso (Grados)' },
      { name: 'Javier López', cat: 'Segundo curso (Grados)' },
      { name: 'Carmen Martín', cat: 'Segundo curso (Grados)' },
      { name: 'Jorge Pérez', cat: 'Segundo curso (Grados)' },
      // 3/4 Software
      { name: 'Marta García', cat: 'Tercer y cuarto curso (Software)' },
      { name: 'Luis Navarro', cat: 'Tercer y cuarto curso (Software)' },
      { name: 'Isabel Ruiz', cat: 'Tercer y cuarto curso (Software)' },
      // 3/4 Computadores
      { name: 'Antonio Díaz', cat: 'Tercer y cuarto curso (Computadores)' },
      { name: 'Beatriz Alonso', cat: 'Tercer y cuarto curso (Computadores)' },
      { name: 'Francisco Torres', cat: 'Tercer y cuarto curso (Computadores)' },
      // 3/4 TSI
      { name: 'Teresa Romero', cat: 'Tercer y cuarto curso (TSI)' },
      { name: 'Manuel Gil', cat: 'Tercer y cuarto curso (TSI)' },
      { name: 'Roberto Cano', cat: 'Tercer y cuarto curso (TSI)' },
      // 3/4 Sistemas Info
      { name: 'Sonia Vega', cat: 'Tercer y cuarto curso (Sistemas de Información)' },
      { name: 'Pablo Herrero', cat: 'Tercer y cuarto curso (Sistemas de Información)' },
      { name: 'Iván Blanco', cat: 'Tercer y cuarto curso (Sistemas de Información)' },
      // CDIA
      { name: 'Lucía Méndez', cat: 'Grado en CDIA' },
      { name: 'Fernando Rivas', cat: 'Grado en CDIA' },
      { name: 'Esther Molina', cat: 'Grado en CDIA' },
      // Master
      { name: 'Vicente Pascual', cat: 'Másteres universitarios' },
      { name: 'Raquel Ortega', cat: 'Másteres universitarios' },
      { name: 'Adrián Bravo', cat: 'Másteres universitarios' },
      // Innovación
      { name: 'Natalia Ramos', cat: 'Innovación Educativa' },
      { name: 'Sergio Vidal', cat: 'Innovación Educativa' },
      { name: 'Silvia Soler', cat: 'Innovación Educativa' },
      // PDI x PTGAS
      { name: 'Andrés Castro', cat: 'PDI más valorado por PTGAS' },
      { name: 'Mónica Serrano', cat: 'PDI más valorado por PTGAS' },
    ]

    for (const record of pdiNames) {
      await Participante.create({
        nombreCompleto: record.name,
        categoria: record.cat,
      })
    }

    const ptgasNames = [
      'Ricardo Vargas',
      'Pilar Jiménez',
      'Daniel Castro',
      'Silvia Ortiz',
      'Hugo Silva',
      'Rosa Medina',
      'Raúl Delgado',
      'Natalia Flores',
    ]

    for (const name of ptgasNames) {
      await Participante.create({
        nombreCompleto: name,
        categoria: 'PTGAS en activo más valorado',
      })
    }

    // Premio Honorífico
    await Participante.create({
      nombreCompleto: 'Dr. Alberto Sanz (Jubilado)',
      categoria: 'Premio Honorífico',
    })
  }
}
