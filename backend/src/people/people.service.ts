import { orm } from "../shared/db/orm.js";
import { Person } from "./people.entity.js";
import { EntityManager, RequiredEntityData } from "@mikro-orm/core";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import sgMail from "@sendgrid/mail";
import { Schedule } from "../schedule/schedules.entity.js";
import MailService from "../config/sendGrid.js";

dotenv.config();

const em = orm.em;

export class PeopleService {
  private mailService: MailService;

  constructor() {
    this.mailService = new MailService();
  }

  private validateDocNumber(docNumber: any): boolean {
    return !docNumber || /^\d+$/.test(String(docNumber));
  }

  private normalizePhoneNumber(phoneNumber: any): string {
    return String(phoneNumber).replace(/\D/g, "");
  }

  private validatePhoneNumber(phoneNumber: any): boolean {
    return !phoneNumber || /^\d{10}$/.test(this.normalizePhoneNumber(phoneNumber));
  }

  private validateEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
 
  async findAllPeople(): Promise<Person[]> {
    return await em.find(Person, {});
  }

  async findAllPerType(peopleType: string): Promise<Person[]> {
    return await em.find(Person, { type: peopleType });
  }

  async findAllPerTypeActive(peopleType: string): Promise<Person[]> {
    return await em.find(Person, { type: peopleType, active: true });
  }

  async findAllNoAdmin(): Promise<Person[]> {
    return await em.find(Person, { type: { $ne: "admin" } });
  }

  async findPersonByEmail(email: string, emT?: EntityManager): Promise<Person> {
    return (emT || em).findOneOrFail(Person, { email });
  }

  async findPersonOrNull(email: string): Promise<Person | null> {
    return em.findOne(Person, { email });
  }

  async findProfessionalsWithOffices(officeId?: number): Promise<any[]> {
    const filter: any = { person: { type: "professional", active: true } };
    if (officeId) filter.room = { office: { idOffice: officeId } };

    const schedules = await em.find(Schedule, filter, {
      populate: ["person", "room.office", "room.office.city"],
    });

    const map = new Map<string, any>();
    for (const s of schedules) {
      const email = s.person.email;
      if (!map.has(email)) {
        map.set(email, {
          email,
          name: s.person.name,
          surname: s.person.surname,
          speciality: s.person.speciality,
          offices: new Map<number, string>(),
        });
      }
      const office = s.room.office;
      map.get(email).offices.set(office.idOffice, {
        id: office.idOffice,
        name: office.description,
        city: office.city.nameCity,
      });
    }

    return Array.from(map.values()).map((p) => ({
      email: p.email,
      name: p.name,
      surname: p.surname,
      speciality: p.speciality,
      offices: Array.from(p.offices.values()),
    }));
  }

  async findProfesionalByOffice(officeId: number, speciality?: string): Promise<Person[]> {
    const query = em
      .createQueryBuilder(Schedule, "s")
      .select("p.*")
      .distinct()
      .join("s.person", "p")
      .join("s.room", "r")
      .join("r.office", "o")
      .where({ "o.idOffice": officeId, "p.type": "professional", "p.active": true });

    if (speciality) {
      query.andWhere({ "p.speciality": speciality });
    }

    return await query.execute();
  }

  async createPerson(data: RequiredEntityData<Person>) {
    if (data.phoneNumber)
      data.phoneNumber = this.normalizePhoneNumber(data.phoneNumber);

    if (!this.validateDocNumber(data.docNumber))
      throw new Error("El número de documento debe contener solo dígitos");
    if (!this.validatePhoneNumber(data.phoneNumber))
      throw new Error("El número de teléfono debe contener 10 dígitos");
    if (data.email && !this.validateEmail(data.email))
      throw new Error("El email no tiene un formato válido");

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const person = em.create(Person, { ...data, password: hashedPassword });
    await em.flush();
    await this.sendWelcomeEmail(person);
    return person;
  }

  private async sendWelcomeEmail(person: Person) {
    const htmlContent = `<div style="font-family: Arial, Helvetica, sans-serif; color: #333; background: #f5f7fb; padding: 24px;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
        <h1 style="margin: 0 0 8px; color: #0b62ff;">¡Bienvenido${person.name ? " " + person.name : ""}!</h1>
        <p style="margin: 0 0 16px;">Gracias por registrarte en <strong>Consultorios Jardín</strong>. Nos alegra que te hayas sumado.</p>
        <p style="margin: 0 0 20px;">Con tu cuenta podrás gestionar turnos, ver profesionales y mucho más desde una sola plataforma.</p>
        <a href="${process.env.BASE_URL || "#"}" style="display: inline-block; text-decoration: none; background: #0b62ff; color: #fff; padding: 10px 16px; border-radius: 6px;">Ir al sitio web</a>
        <hr style="border: none; border-top: 1px solid #eef2ff; margin: 20px 0;" />
        <p style="font-size: 12px; color: #777; margin: 0;">Si no solicitaste esta cuenta, simplemente ignora este correo.</p>
      </div>
      </div>`;
    const message = await this.mailService.createMessage(person.email, "Bienvenido a Consultorios Jardín", htmlContent);
    await this.mailService.sendMail(message);
  }

  async createPersonTokens(personEmail: string, personType: string) {
    const token = jwt.sign({ email: personEmail, type: personType }, process.env.JWT_SECRET as jwt.Secret, {
      expiresIn: "15m",
    });

    const refreshToken = jwt.sign({ email: personEmail, type: personType }, process.env.REFRESH_SECRET as jwt.Secret, {
      expiresIn: "30d",
    });

    return { token, refreshToken };
  }

  async updatePerson(data: Partial<Person>, email: string) {
    const person = await em.findOneOrFail(Person, { email });
    em.assign(person, { ...data });
    await em.flush();
    return person;
  }

  async changePassword(token: any, newPassword: string) {
    try {
      const decodedToken = jwt.verify(token, process.env.CHANGE_SECRET as jwt.Secret) as any;
      const email = decodedToken.email;
      const person = await em.findOneOrFail(Person, { email });
      const newPasswordHash = await bcrypt.hash(newPassword, 10);
      person.password = newPasswordHash;
      await em.flush();
    } catch (error: any) {
      throw new Error("Token expirado");
    }
  }

  async deletePersonRequest(email: string) {
    //El metodo permite eliminar un profesional siempre y cuando no este activo, es decir, sea una request. Si ya trabajo previamente, la bd tirara error y no lo permitira
    const person = await em.findOneOrFail(Person, { email });

    if (!person.active && person.type == "professional") {
      await em.removeAndFlush(person);
      return true;
    }

    return false;
  }

  async sendPasswordMail(email: string) {
    sgMail.setApiKey(process.env.SENDGRID_KEY as any);

    const changeToken = jwt.sign({ email }, process.env.CHANGE_SECRET as jwt.Secret, { expiresIn: "30m" });
    const url = `${process.env.BASE_URL}/reset-password?token=${changeToken}`;
    const fromMail = process.env.MAIL as string;

    const msg = {
      to: email,
      from: fromMail,
      replyTo: fromMail,
      subject: "Recuperar contraseña",
      html: `
          <h3>Hola!</h3>
          <p>Para restablecer tu contraseña hacé click en el siguiente enlace:</p>
          <a href="${url}">${url}</a>
          <p>Este link expira en 30 minutos.</p>`,
    };

    await sgMail.send(msg);
  }

  async toggleState(email: string) {
    const person = await em.findOneOrFail(Person, { email });
    em.assign(person, { ...person, active: !person.active });
    await em.flush();
    return true;
  }
}
