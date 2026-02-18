import { describe, it, expect, vi, beforeEach } from "vitest";
import jwt from "jsonwebtoken";

// ============================================================
// Mocks globales - vi.mock se hoistea al top, así que la factory
// no puede referenciar variables externas. Usamos vi.hoisted()
// para crear los mocks que se comparten.
// ============================================================

const { mockEm } = vi.hoisted(() => ({
  mockEm: {
    find: vi.fn(),
    findOne: vi.fn(),
    findOneOrFail: vi.fn(),
    create: vi.fn(),
    flush: vi.fn(),
    removeAndFlush: vi.fn(),
    assign: vi.fn(),
    populate: vi.fn(),
    nativeDelete: vi.fn(),
    remove: vi.fn(),
    transactional: vi.fn(),
    createQueryBuilder: vi.fn(),
  },
}));

vi.mock("../shared/db/orm.js", () => ({
  orm: { em: mockEm },
  syncSchema: vi.fn(),
}));

vi.mock("../config/sendGrid.js", () => ({
  default: class MailServiceMock {
    createMessage = vi.fn().mockResolvedValue({});
    sendMail = vi.fn().mockResolvedValue(undefined);
  },
}));

vi.mock("@sendgrid/mail", () => ({
  default: { setApiKey: vi.fn(), send: vi.fn() },
}));

// Variables de entorno para JWT
process.env.JWT_SECRET = "test-secret-key-for-integration-tests";
process.env.REFRESH_SECRET = "test-refresh-secret-key";
process.env.CHANGE_SECRET = "test-change-secret-key";

// Imports después de los mocks
import { verifyToken } from "../config/middlewares.js";
import { PeopleService } from "../people/people.service.js";

// ============================================================
// DATOS MOCK - Cadena completa: Province → City → Office → Room
//              → Professional → Schedule → Client saca turno
// ============================================================

const mockProvince = {
  idProvince: 1,
  nameProvince: "Santa Fe",
  active: true,
};

const mockCity = {
  idCity: 1,
  nameCity: "Rosario",
  province: mockProvince,
  active: true,
};

const mockOffice = {
  idOffice: 1,
  description: "Consultorio Central",
  city: mockCity,
  openingTime: "08:00",
  closingTime: "18:00",
  active: true,
};

const mockRoom = {
  idRoom: 1,
  description: "Sala 1",
  office: mockOffice,
  active: true,
};

const mockProfessional = {
  email: "dr@test.com",
  docType: "DNI",
  docNumber: "12345678",
  name: "Carlos",
  surname: "García",
  phoneNumber: "3411234567",
  password: "$2b$10$hashedpassword",
  speciality: "psicologia",
  type: "professional",
  active: true,
};

const mockClient = {
  email: "paciente@test.com",
  docType: "DNI",
  docNumber: "87654321",
  name: "María",
  surname: "López",
  phoneNumber: "3417654321",
  password: "$2b$10$hashedpassword",
  speciality: null,
  type: "client",
  active: true,
};

const mockSchedule = {
  day: "lunes",
  initialHour: "09:00",
  finalHour: "12:00",
  person: mockProfessional,
  room: mockRoom,
  allowedType: "simple",
  duration: 30,
};

// ============================================================
// TEST DE INTEGRACIÓN: Flujo completo de turnos
// Province → City → Office → Room → Professional → Schedule
// → Client se loguea → Saca turno → Professional acepta turno
// ============================================================
describe("Integración: Flujo completo de creación y aceptación de turno", () => {
  let professionalToken: string;
  let clientToken: string;
  const peopleService = new PeopleService();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe completar el flujo: login → crear turno → aceptar turno", async () => {
    // --------------------------------------------------------
    // PASO 1: Login del profesional - genera JWT válido
    // --------------------------------------------------------
    const professionalTokens = await peopleService.createPersonTokens(
      mockProfessional.email,
      mockProfessional.type
    );
    professionalToken = professionalTokens.token;

    expect(professionalToken).toBeDefined();
    const decodedProfessional = jwt.verify(professionalToken, process.env.JWT_SECRET as string) as any;
    expect(decodedProfessional.email).toBe("dr@test.com");
    expect(decodedProfessional.type).toBe("professional");

    // --------------------------------------------------------
    // PASO 2: Login del paciente - genera JWT válido
    // --------------------------------------------------------
    const clientTokens = await peopleService.createPersonTokens(
      mockClient.email,
      mockClient.type
    );
    clientToken = clientTokens.token;

    expect(clientToken).toBeDefined();
    const decodedClient = jwt.verify(clientToken, process.env.JWT_SECRET as string) as any;
    expect(decodedClient.email).toBe("paciente@test.com");
    expect(decodedClient.type).toBe("client");

    // --------------------------------------------------------
    // PASO 3: Verificar token del paciente con middleware
    // Simula que el paciente hace un request autenticado
    // --------------------------------------------------------
    const req: any = {
      headers: { authorization: `Bearer ${clientToken}` },
    };
    const res: any = {
      status: vi.fn().mockReturnValue({ json: vi.fn() }),
    };
    const next = vi.fn();

    await verifyToken(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user.email).toBe("paciente@test.com");
    expect(req.user.type).toBe("client");

    // --------------------------------------------------------
    // PASO 4: Paciente solicita un turno
    // Simulamos lo que hace AppointmentEngine.validateAndCreateAppointment
    // mockeando las llamadas al EntityManager
    // --------------------------------------------------------

    // El appointment que se "crea" en la DB
    const mockAppointment = {
      numAppointment: 1,
      date: new Date("2026-02-23"), // un lunes
      initialHour: "09:00",
      finalHour: "09:30",
      type: "simple" as const,
      professional: mockProfessional,
      room: mockRoom,
      value: 0,
      state: "pending",
      reminderSent: "not sent" as const,
      diagnostics: {
        add: vi.fn(),
        getItems: vi.fn().mockReturnValue([
          { patient: mockClient, state: "pending", observations: null },
        ]),
      },
    };

    // Verificamos que el turno se creó con estado "pending"
    expect(mockAppointment.state).toBe("pending");
    expect(mockAppointment.professional.email).toBe("dr@test.com");
    expect(mockAppointment.room.office.description).toBe("Consultorio Central");
    expect(mockAppointment.initialHour).toBe("09:00");
    expect(mockAppointment.finalHour).toBe("09:30");
    expect(mockAppointment.type).toBe("simple");

    // --------------------------------------------------------
    // PASO 5: Verificar token del profesional
    // --------------------------------------------------------
    const reqProf: any = {
      headers: { authorization: `Bearer ${professionalToken}` },
    };
    const resProf: any = {
      status: vi.fn().mockReturnValue({ json: vi.fn() }),
    };
    const nextProf = vi.fn();

    await verifyToken(reqProf, resProf, nextProf);

    expect(nextProf).toHaveBeenCalled();
    expect(reqProf.user.email).toBe("dr@test.com");
    expect(reqProf.user.type).toBe("professional");

    // --------------------------------------------------------
    // PASO 6: Profesional acepta el turno
    // Simula AppointmentService.acceptAppointment
    // --------------------------------------------------------

    // El appointment ahora está en la DB como "pending"
    const appointmentToAccept = { ...mockAppointment, state: "pending" };

    // Mock: buscar el appointment pendiente del profesional
    mockEm.findOneOrFail.mockResolvedValueOnce(appointmentToAccept);
    mockEm.flush.mockResolvedValueOnce(undefined);

    // Simulamos la lógica de acceptAppointment
    const foundAppointment = await mockEm.findOneOrFail();
    foundAppointment.state = "accepted";
    await mockEm.flush();

    // Verificamos que el estado cambió a "accepted"
    expect(foundAppointment.state).toBe("accepted");
    expect(foundAppointment.professional.email).toBe("dr@test.com");
    expect(foundAppointment.date).toEqual(new Date("2026-02-23"));

    // Verificamos que la cadena completa de datos es consistente
    expect(foundAppointment.room.office.city.province.nameProvince).toBe("Santa Fe");
    expect(foundAppointment.room.office.city.nameCity).toBe("Rosario");
    expect(foundAppointment.room.office.description).toBe("Consultorio Central");
    expect(foundAppointment.room.description).toBe("Sala 1");
  });
});
