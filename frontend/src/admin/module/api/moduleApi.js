import axios from 'axios';

const API_URL = 'http://localhost:8083/modules'; // Adjust based on your backend URL

export const getModules = async (filters) => {
  try {
    const response = await axios.get(API_URL, { params: filters });
    return response.data;
  } catch (error) {
    throw new Error('Error fetching modules');
  }
};

export const addModule = async (moduleData) => {
  try {
    const response = await axios.post(API_URL, moduleData);
    return response.data;
  } catch (error) {
    throw new Error('Error adding module');
  }
};

export const deleteModule = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    throw new Error('Error deleting module');
  }
};