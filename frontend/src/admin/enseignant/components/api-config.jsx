import axios from "axios"

// Configure Axios with base URL and auth interceptor
const api = axios.create({
  baseURL: "http://users.localhost/api",
})

// Add JWT token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Function to generate a random password
export const generateRandomPassword = (length = 8) => {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let password = ""
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length)
    password += charset[randomIndex]
  }
  return password
}

// Validate email format
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Normalize teacher data to ensure Matricule and modules consistency
export const normalizeTeacher = (teacher) => ({
  ...teacher,
  Matricule: teacher.matricule || teacher.Matricule,
  matricule: teacher.matricule || teacher.Matricule,
  motdepasse: teacher.motdepasse || "",
  sections: Array.isArray(teacher.sections) ? teacher.sections : [],
  modules: Array.isArray(teacher.modules) ? teacher.modules : [],
})

export default api
