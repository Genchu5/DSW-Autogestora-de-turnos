import { describe, it, expect, vi } from "vitest";
import jwt from "jsonwebtoken";

// ============================================================
// Mock del módulo orm ANTES de importar cualquier servicio
// Esto evita que MikroORM intente conectarse a MySQL
// ============================================================
vi.mock("../shared/db/orm.js", () => ({
  orm: {
    em: {
      find: vi.fn(),
      findOne: vi.fn(),
      findOneOrFail: vi.fn(),
      create: vi.fn(),
      flush: vi.fn(),
      removeAndFlush: vi.fn(),
      assign: vi.fn(),
      populate: vi.fn(),
      nativeDelete: vi.fn(),
      createQueryBuilder: vi.fn(),
    },
    syncSchema: vi.fn(),
  },
  syncSchema: vi.fn(),
}));

// Mock de sendGrid para evitar que se intente enviar mails
vi.mock("../config/sendGrid.js", () => ({
  default: class MailServiceMock {
    createMessage = vi.fn();
    sendMail = vi.fn();
  },
}));

// Seteamos variables de entorno para JWT antes de importar los módulos
process.env.JWT_SECRET = "test-secret-key-for-unit-tests";
process.env.REFRESH_SECRET = "test-refresh-secret-key";
process.env.CHANGE_SECRET = "test-change-secret-key";

// Ahora sí importamos los módulos que queremos testear
import { verifyToken } from "../config/middlewares.js";
import { sanitizePersonInput } from "../people/people.controller.js";
import { ScheduleService } from "../schedule/schedule.service.js";

// ============================================================
// TEST 1: verifyToken rechaza requests sin token
// ============================================================
describe("verifyToken - sin token", () => {
  it("debe retornar 401 cuando no se envía token en los headers", async () => {
    const req: any = {
      headers: {},
    };

    const jsonMock = vi.fn();
    const statusMock = vi.fn().mockReturnValue({ json: jsonMock });
    const res: any = { status: statusMock };
    const next = vi.fn();

    await verifyToken(req, res, next);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ message: "No autorizado" });
    expect(next).not.toHaveBeenCalled();
  });
});

// ============================================================
// TEST 2: verifyToken llama next() con token válido
// ============================================================
describe("verifyToken - token válido", () => {
  it("debe setear req.user y llamar next() cuando el token es válido", async () => {
    const payload = { email: "test@test.com", type: "client" };
    const token = jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: "15m" });

    const req: any = {
      headers: {
        authorization: `Bearer ${token}`,
      },
    };

    const res: any = {
      status: vi.fn().mockReturnValue({ json: vi.fn() }),
    };
    const next = vi.fn();

    await verifyToken(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user.email).toBe("test@test.com");
    expect(req.user.type).toBe("client");
  });
});

// ============================================================
// TEST 3: sanitizePersonInput limpia campos undefined
// ============================================================
describe("sanitizePersonInput", () => {
  it("debe eliminar campos undefined y conservar los definidos, luego llamar next()", () => {
    const req: any = {
      body: {
        email: "paciente@test.com",
        name: "Juan",
        // Los demás campos no se envían, quedan undefined
      },
    };
    const res: any = {};
    const next = vi.fn();

    sanitizePersonInput(req, res, next);

    const sanitized = req.body.sanitizedInput;

    // Los campos definidos deben estar presentes
    expect(sanitized.email).toBe("paciente@test.com");
    expect(sanitized.name).toBe("Juan");

    // Los campos undefined deben haber sido eliminados
    expect(sanitized).not.toHaveProperty("docType");
    expect(sanitized).not.toHaveProperty("docNumber");
    expect(sanitized).not.toHaveProperty("surname");
    expect(sanitized).not.toHaveProperty("phoneNumber");
    expect(sanitized).not.toHaveProperty("password");
    expect(sanitized).not.toHaveProperty("speciality");
    expect(sanitized).not.toHaveProperty("type");

    // active tiene default true, así que debe existir
    expect(sanitized.active).toBe(true);

    // Debe llamar next()
    expect(next).toHaveBeenCalled();
  });
});

// ============================================================
// TEST 4: ScheduleService.isValidHourFormat
// ============================================================
describe("ScheduleService.isValidHourFormat", () => {
  const scheduleService = new ScheduleService();

  it("debe retornar true para formatos de hora válidos", () => {
    expect(scheduleService.isValidHourFormat("08:00")).toBe(true);
    expect(scheduleService.isValidHourFormat("23:59")).toBe(true);
    expect(scheduleService.isValidHourFormat("00:00")).toBe(true);
    expect(scheduleService.isValidHourFormat("12:30")).toBe(true);
  });

  it("debe retornar false para formatos de hora inválidos", () => {
    expect(scheduleService.isValidHourFormat("25:00")).toBe(false);
    expect(scheduleService.isValidHourFormat("abc")).toBe(false);
    expect(scheduleService.isValidHourFormat("8:00")).toBe(false); // falta el 0 adelante
    expect(scheduleService.isValidHourFormat("")).toBe(false);
    expect(scheduleService.isValidHourFormat("24:00")).toBe(false);
    expect(scheduleService.isValidHourFormat("12:60")).toBe(false);
  });
});

// ============================================================
// TEST 5: ScheduleService.isValidDay
// ============================================================
describe("ScheduleService.isValidDay", () => {
  const scheduleService = new ScheduleService();

  it("debe retornar true para días válidos de la semana", () => {
    expect(scheduleService.isValidDay("lunes")).toBe(true);
    expect(scheduleService.isValidDay("Viernes")).toBe(true);
    expect(scheduleService.isValidDay("sábado")).toBe(true); // con acento → removeAccents lo normaliza
    expect(scheduleService.isValidDay("MIERCOLES")).toBe(true);
    expect(scheduleService.isValidDay("domingo")).toBe(true);
  });

  it("debe retornar false para días inválidos", () => {
    expect(scheduleService.isValidDay("foo")).toBe(false);
    expect(scheduleService.isValidDay("")).toBe(false);
    expect(scheduleService.isValidDay("sunday")).toBe(false);
    expect(scheduleService.isValidDay("monday")).toBe(false);
  });
});
