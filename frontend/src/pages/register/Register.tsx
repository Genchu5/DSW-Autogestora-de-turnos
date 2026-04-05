import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGreaterThan } from "@fortawesome/free-solid-svg-icons";
import "./Register.css";
import Logo from "../../assets/LogoRecortado.png";
import { useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { DataInput } from "../../components/inputs/standardTextInput/DataInput";
import { DataInputPassword } from "../../components/inputs/passwordInput/DataInputPassword";
import { DataInputSelector } from "../../components/inputs/selectorInput/DataInputSelector";
import api from "../../axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ReCaptcha from "../../components/reCaptcha.tsx";



export function Register() {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    contraseña: "",
    confirmarContraseña: "",
    telefono: "",
    tipoDocumento: "",
    nroDocumento: "",
  });

  const navigate = useNavigate();
  const [showButton, setShowButton] = useState(true);
  const [captchaOk, setCaptchaOk] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast.dismiss();

    if (formData.contraseña !== formData.confirmarContraseña) {
      toast.error("Las contraseñas no coinciden", {
        className: "feedBack-box error",
      });
      return;
    }

    if (!captchaOk) {
      toast.error("Por favor, completá el captcha", {
        className: "feedBack-box error",
      });
      return;
    }

    // Validaciones mínimas (También se tiene que hacer en el backend)
    if (
      !formData.email ||
      !formData.nombre ||
      !formData.apellido ||
      !formData.contraseña ||
      !formData.confirmarContraseña ||
      !formData.telefono ||
      !formData.tipoDocumento ||
      !formData.nroDocumento
    ) {
      toast.error("Complete todos los campos requeridos", {
        className: "feedBack-box error",
      });
      return;
    }

    api
      .post(
        "/people",
        {
          name: formData.nombre,
          surname: formData.apellido,
          email: formData.email,
          docType: formData.tipoDocumento,
          docNumber: formData.nroDocumento,
          phoneNumber: formData.telefono,
          password: formData.contraseña,
          type: "client",
        },
        {
          withCredentials: true, // sin esto, no se envía ni se recibe la cookie
        }
      )
      .then((response) => {
        if (response.data.token) {
          localStorage.setItem("token", response.data.token);
          toast.success("Usuario registrado con éxito", {
            className: "feedBack-box success",});
            setShowButton(false);
            
            api
              .post(
                "/people/login",
                {
                  email: formData.email,
                  password: formData.contraseña,
                },
                {
                  withCredentials: true, // sin esto, no se envía ni se recibe la cookie
                }
              )
              .then((response) => {
                if (response.data.token) {
                  localStorage.setItem("token", response.data.token);

                  login(response.data.token);
                  
                  setTimeout(() => {
                    navigate("/")
                    window.scrollTo(0, 0);}
                  , 3000);
                  
                }
              })
              .catch((error) => {
                console.error("Login error:", error);
                toast.error("Error en el inicio de sesión", {
                  className: "feedBack-box error",
                });
              });
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        toast.error("Error al registrar usuario", {
          className: "feedBack-box error",
        });
      });
  };

  const [activo, setPage] = useState(false);

  const changePage = () => {
    if (!activo) {
      if (!formData.email || !formData.contraseña || !formData.confirmarContraseña) {
        toast.error("Complete todos los campos requeridos", { className: "feedBack-box error" });
        return;
      }
      if (formData.contraseña !== formData.confirmarContraseña) {
        toast.error("Las contraseñas no coinciden", { className: "feedBack-box error" });
        return;
      }
    }
    setPage(!activo);
  };

  return (
    <div className="user-register-container">
      <div className="register-title">
        <FontAwesomeIcon className="title-icon" icon={faGreaterThan} />
        <h1 className="title-text">Registro de Usuario</h1>
      </div>
      <form className="register-form" onSubmit={handleSubmit}>
        <div className="register-body">
          <div className="register-body-left">
            <div className={activo ? "shown" : "not-shown"}>
              <DataInput label="Nombre" type="text" value={formData.nombre} onChange={(e) => handleChange("nombre", e.target.value)} />
              <DataInput
                label="Apellido"
                type="text"
                value={formData.apellido}
                onChange={(e) => handleChange("apellido", e.target.value)}
              />
            </div>

            <div className={activo ? "not-shown" : "shown"}>
              <DataInput label="Email" type="email" value={formData.email} onChange={(e) => handleChange("email", e.target.value)} />
              <DataInputPassword
                label="Contraseña"
                value={formData.contraseña}
                onChange={(e) => handleChange("contraseña", e.target.value)}
              />
              <DataInputPassword
                label="Confirmar contraseña"
                value={formData.confirmarContraseña}
                onChange={(e) => handleChange("confirmarContraseña", e.target.value)}
              />
            </div>

            <div className={activo ? "shown" : "not-shown"}>
              <DataInput
                label="Teléfono"
                type="text"
                value={formData.telefono}
                onChange={(e) => handleChange("telefono", e.target.value)}
              />
              <div className="document-dataInput">
                <div className="tipoDoc">
                  <DataInputSelector
                    label="Tipo documento"
                    type="selector"
                    options={["DNI", "Pasaporte", "Cédula de Identidad", "Libreta de Enrolamiento", "Libreta Cívica", "Otro"]}
                    value={formData.tipoDocumento}
                    onChange={(e) => handleChange("tipoDocumento", e.target.value)}
                  />
                </div>
                <div className="nroDoc">
                  <DataInput
                    label="Nro. documento"
                    type="text"
                    value={formData.nroDocumento}
                    onChange={(e) => handleChange("nroDocumento", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="register-body-right">
            <div className="logo-consultorios">
              <img src={Logo} alt="Logo" />
            </div>

            <div className="register-toast-wrapper">
              <ToastContainer position="top-right" closeOnClick={false} draggable={false} />
            </div>

            <div className="captcha-container">
              <ReCaptcha onChange={setCaptchaOk} />
            </div>

            <button type="button" className={activo ? "register-button next shown" : "register-button next not-shown"} onClick={changePage}>
              Volver
            </button>

            {showButton
            ? <button type="submit" className={activo ? "register-button registerBut shown" : "register-button registerBut not-shown"} >Registrar</button>
            : <div className="register-spinner"></div>}

            <button type="button" className={activo ? "register-button next not-shown" : "register-button next shown"} onClick={changePage}>
              Siguiente
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}