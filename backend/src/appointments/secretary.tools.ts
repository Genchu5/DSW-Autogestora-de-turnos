import Groq from "groq-sdk";


export const SECRETARY_TOOLS: Groq.Chat.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "get_active_offices",
      description: "Obtiene la lista de consultorios médicos activos disponibles en el sistema.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_professionals",
      description: "Obtiene la lista de profesionales disponibles con los consultorios donde atienden y su localidad. Filtrá por especialidad vos mismo usando el campo 'speciality' del resultado. Opcionalmente filtrá por consultorio con officeId.",
      parameters: {
        type: "object",
        properties: {
          officeId: {
            type: "number",
            description: "ID del consultorio para filtrar profesionales. Opcional.",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_available_appointments",
      description: "Consulta los turnos disponibles con un profesional en un consultorio específico para el paciente actual.",
      parameters: {
        type: "object",
        properties: {
          professionalEmail: {
            type: "string",
            description: "Email del profesional con quien se quiere sacar el turno.",
          },
          officeId: {
            type: "number",
            description: "ID del consultorio donde se atenderá.",
          },
        },
        required: ["professionalEmail", "officeId"],
      },
    },
  },
];
