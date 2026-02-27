import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Participante from '#models/participante'

export default class extends BaseSeeder {
    async run() {
        const nombresPDI = [
            'Ana Martínez', 'Carlos Gómez', 'Elena Rodríguez', 'David Fernández',
            'Laura Sánchez', 'Javier López', 'Carmen Martín', 'Jorge Pérez',
            'Marta García', 'Luis Navarro', 'Isabel Ruiz', 'Antonio Díaz',
            'Beatriz Alonso', 'Francisco Torres', 'Teresa Romero', 'Manuel Gil'
        ]

        const nombresPTGAS = [
            'Ricardo Vargas', 'Pilar Jiménez', 'Daniel Castro', 'Silvia Ortiz',
            'Hugo Silva', 'Rosa Medina', 'Raúl Delgado', 'Natalia Flores'
        ]

        const categoriasPDI = [
            'Primer curso (Grados)',
            'Segundo curso (Grados)',
            'Tercer y cuarto curso (Software)',
            'Tercer y cuarto curso (Computadores)',
            'Tercer y cuarto curso (TSI)',
            'Tercer y cuarto curso (Sistemas de Información)',
            'Grado en CDIA',
            'Másteres universitarios',
            'Innovación Educativa',
            'PDI más valorado por PTGAS'
        ]

        const categoriasPTGAS = [
            'PTGAS en activo más valorado'
        ]

        let pdiIndex = 0

        for (const cat of categoriasPDI) {
            const numCandidatos = Math.floor(Math.random() * 3) + 3

            for (let i = 0; i < numCandidatos; i++) {
                const nombre = nombresPDI[pdiIndex % nombresPDI.length]
                pdiIndex++

                await Participante.create({
                    nombreCompleto: nombre,
                    categoria: cat
                })
            }
        }

        let ptgasIndex = 0

        for (const cat of categoriasPTGAS) {
            for (let i = 0; i < 6; i++) {
                const nombre = nombresPTGAS[ptgasIndex % nombresPTGAS.length]
                ptgasIndex++

                await Participante.create({
                    nombreCompleto: nombre,
                    categoria: cat
                })
            }
        }

        // Premio Honorífico
        await Participante.create({
            nombreCompleto: 'Dr. Alberto Sanz (Jubilado)',
            categoria: 'Premio Honorífico (Jubilado)'
        })
    }
}
