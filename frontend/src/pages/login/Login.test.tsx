import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Login } from "./Login";
import { BrowserRouter } from "react-router-dom";
import * as jwtDecodeModule from "jwt-decode";
import * as AuthContextModule from "../../context/AuthContext";
import * as LoginServiceModule from "./loginServices";

// --- MOCKS ---

// 1. Mock de react-router-dom
const mockedNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
  };
});

// 2. Mock de jwt-decode
vi.mock("jwt-decode", () => ({
  jwtDecode: vi.fn(),
}));

// 3. Mock del AuthContext
const mockedLoginContext = vi.fn();
vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
  login: mockedLoginContext,
  logout: vi.fn(),
  token: null
});

// 4. MOCK DEL LOGIN SERVICE
vi.mock("./loginServices", () => ({
  LoginService: vi.fn(),
}));

// 5. Mock de ReCaptcha — simula captcha completado
vi.mock("../../components/reCaptcha", () => ({
  default: ({ onChange }: { onChange: (ok: boolean) => void }) => {
    onChange(true);
    return null;
  },
}));

describe("Login Component", () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  const renderComponent = () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
  };

  it("Debe renderizar el formulario correctamente", () => {
    renderComponent();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Iniciar sesión/i })).toBeInTheDocument();
  });

  it("Debe mostrar error si se intenta enviar vacío y NO llamar al servicio", async () => {
    renderComponent();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /Iniciar sesión/i }));

    expect(await screen.findByText("Complete todos los campos requeridos")).toBeInTheDocument();
    expect(LoginServiceModule.LoginService).not.toHaveBeenCalled();
  });

  it("Debe llamar al servicio y redirigir a CLIENTE si todo sale bien", async () => {
    renderComponent();
    const user = userEvent.setup();
    const fakeToken = "token.falso.cliente";

    (LoginServiceModule.LoginService as any).mockResolvedValue({ token: fakeToken });
    (jwtDecodeModule.jwtDecode as any).mockReturnValue({ type: "client" });

    await user.type(screen.getByLabelText(/Email/i), "cliente@test.com");
    await user.type(screen.getByLabelText(/Contraseña/i), "123456");
    await user.click(screen.getByRole("button", { name: /Iniciar sesión/i }));

    await waitFor(() => {
        expect(LoginServiceModule.LoginService).toHaveBeenCalledWith("cliente@test.com", "123456");
        expect(localStorage.getItem("token")).toBe(fakeToken);
        expect(mockedLoginContext).toHaveBeenCalledWith(fakeToken);
        expect(mockedNavigate).toHaveBeenCalledWith("/");
    });
  });

  it("Debe redirigir a ADMIN si el token es de tipo admin", async () => {
    renderComponent();
    const user = userEvent.setup();
    const adminToken = "token.falso.admin";

    (LoginServiceModule.LoginService as any).mockResolvedValue({ token: adminToken });
    (jwtDecodeModule.jwtDecode as any).mockReturnValue({ type: "admin" });

    await user.type(screen.getByLabelText(/Email/i), "admin@test.com");
    await user.type(screen.getByLabelText(/Contraseña/i), "admin123");
    await user.click(screen.getByRole("button", { name: /Iniciar sesión/i }));

    await waitFor(() => {
        expect(mockedNavigate).toHaveBeenCalledWith("/adminHome");
    });
  });

  it("Debe manejar errores cuando el servicio falla", async () => {
    renderComponent();
    const user = userEvent.setup();
    const errorMsg = "Credenciales incorrectas";
    
    (LoginServiceModule.LoginService as any).mockRejectedValue(new Error(errorMsg));

    await user.type(screen.getByLabelText(/Email/i), "fail@test.com");
    await user.type(screen.getByLabelText(/Contraseña/i), "wrongpass");
    await user.click(screen.getByRole("button", { name: /Iniciar sesión/i }));

    expect(await screen.findByText(errorMsg)).toBeInTheDocument();
    expect(mockedNavigate).not.toHaveBeenCalled();
  });
});