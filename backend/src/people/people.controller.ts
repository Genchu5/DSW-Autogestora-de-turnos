import { Request, Response, NextFunction } from 'express'
import { Person } from './people.entity.js'
import { orm } from '../shared/db/orm.js'
import jwt from 'jsonwebtoken';
import bcrypt from "bcrypt";

const em = orm.em;

function sanitizePersonInput(req: Request, res: Response, next: NextFunction) {

    req.body.sanitizedInput = {
        email: req.body.email,
        docType: req.body.docType,
        docNumber: req.body.docNumber,
        name: req.body.name,
        surname: req.body.surname,
        phoneNumber: req.body.phoneNumber,
        password: req.body.password,
        speciality: req.body.speciality,
        type: req.body.type,
        active: req.body.active !== undefined ? req.body.active : true, // Default state to true if not provided
    }

    //more checks here

    Object.keys(req.body.sanitizedInput).forEach((key) => {
        if (req.body.sanitizedInput[key] === undefined) {
        delete req.body.sanitizedInput[key]
        }
    })

    next()
}

async function findAll(req: Request, res: Response) {
    try {
        const people = await em.find(Person, {})
        const safeData = people.map(person => ({ ...person, password: undefined })); // no devolvemos la contraseña al front
        res.status(200).json({ message: 'People found', data: safeData })
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

async function findOne(req: Request, res: Response) {
    try {
        const person = await em.findOneOrFail(Person, { email: req.params.email } )
        const safeData = { ...person, password: undefined }; // no devolvemos la contraseña al front
        res.status(200).json({message: 'Person found', data: safeData})
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

async function add(req: Request, res: Response) {
    try {
        const { password, ...rest } = req.body.sanitizedInput;

        const hashedPassword = await bcrypt.hash(password, 10);

        const person = em.create(Person, { ...rest, password: hashedPassword });

        await em.flush();

        const token = jwt.sign({ email: req.body.sanitizedInput.email }, process.env.JWT_SECRET as jwt.Secret, { expiresIn: '1h' });

        const safeData = { ...person, password: undefined }; // no devolvemos la contraseña al front

        res.status(201).json({ message: 'Person created', data: safeData, token }) // return person data and token
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

async function update(req: Request, res: Response) {
    try {
        const person = await em.findOneOrFail(Person, { email: req.params.email })
        em.assign(person, req.body.sanitizedInput)
        await em.flush();
        const safeData = { ...person, password: undefined }; // no devolvemos la contraseña al front
        res.status(200).json({ message: 'Person updated', data: safeData })
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

async function remove(req: Request, res: Response) {
        try {
            const email = req.params.email
            const person = await em.findOneOrFail(Person, { email }) //Cambiado por que sino no andaba
            await em.removeAndFlush(person)
            res.status(200).json({ message: 'Person removed' })
        } catch (error: any) {
            res.status(500).json({ message: error.message })
        }
}

async function loginWithEmailAndPassword(req: Request, res: Response) {
    try {
        const { email, password } = req.body;

        const person = await em.findOne(Person, { email });

        if (!person) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        const isValid = await bcrypt.compare(password, person.password);
        if (!isValid) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        const token = jwt.sign({ email: person.email }, process.env.JWT_SECRET as jwt.Secret, { expiresIn: '1h' });

        res.status(200).json({ message: 'Login exitoso', token });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}

export { sanitizePersonInput, findAll, findOne, add, update, remove, loginWithEmailAndPassword }