import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Participante from '#models/participante'
import Profesor from '#models/profesor'

export default class extends BaseSeeder {
    async run() {
        // Definimos nombres realistas para simular un entorno académico real
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
            'PDI más valorado por PTGAS' // PDI receives this from PTGAS
        ]

        const categoriasPTGAS = [
            'PTGAS en activo más valorado' // PTGAS receives this from PDI and PTGAS
        ]

        let pdiIndex = 0;

        // Rellenamos las categorías destinadas al PDI con profesores variados
        for (const cat of categoriasPDI) {
            // 3 a 5 candidatos por categoría
            const numCandidatos = Math.floor(Math.random() * 3) + 3

            for (let i = 0; i < numCandidatos; i++) {
                // Rotamos por la lista de nombres de PDI para asignar
                const nombreAleatorio = nombresPDI[pdiIndex % nombresPDI.length]
                pdiIndex++

                const p = await Participante.create({
                    nombreCompleto: nombreAleatorio,
                    categoria: cat
                })

                await Profesor.create({
                    id: p.id,
                    nombre: nombreAleatorio,
                    categoria: cat,
                    curso: cat.includes('Primer') ? '1º Grado' : 'Múltiples'
                })
            }
        }

        let ptgasIndex = 0;

        // Rellenamos las categorías exclusivas del PTGAS
        for (const cat of categoriasPTGAS) {
            // 6 candidatos para PTGAS
            for (let i = 0; i < 6; i++) {
                const nombreAleatorio = nombresPTGAS[ptgasIndex % nombresPTGAS.length]
                ptgasIndex++;

                const p = await Participante.create({
                    nombreCompleto: nombreAleatorio,
                    categoria: cat
                })

                await Profesor.create({
                    id: p.id,
                    nombre: nombreAleatorio,
                    categoria: cat,
                    curso: 'Administración/Servicios'
                })
            }
        }

        // Opcional: Crear el ganador del premio honorífico para tener presencia visual en algún sitio si se lista todo
        const honorifico = 'Premio Honorífico (Jubilado)'
        const pHonor = await Participante.create({
            nombreCompleto: 'Dr. Alberto Sanz (Jubilado)',
            categoria: honorifico
        })
        await Profesor.create({
            id: pHonor.id,
            nombre: 'Dr. Alberto Sanz',
            categoria: honorifico,
            curso: 'Retirado'
        })

    }
}
