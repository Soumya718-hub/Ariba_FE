import customFetch from "./axios";


// GET ALL USERS / ROLES
export const getAllRoles = async () => {
  const response = await customFetch.get("/userMangement/roles");
  return response.data;
};


// ADD ROLE TO EMPLOYEE
export const addRoleToEmployee = async (data) => {
  const response = await customFetch.post("/userMangement/roles/add", data);
  return response.data;
};


// EDIT EMPLOYEE ROLE
export const editEmployeeRole = async (empId, data) => {
  const response = await customFetch.put(`/userMangement/roles/edit/${empId}`, data);
  return response.data;
};


// TOGGLE EMPLOYEE STATUS
export const toggleEmployeeStatus = async (empId) => {
  const response = await customFetch.put(`/userMangement/roles/toggle-status/${empId}`);
  return response.data;
};


// REMOVE EMPLOYEE
export const removeEmployeeFromRoles = async (empId) => {
  const response = await customFetch.delete(`/userMangement/roles/remove/${empId}`);
  return response.data;
};

//GET ALL CLIENTS/CUTSOMER

export const getAllClients = async () => {
  const response = await customFetch.get("/userMangement/clients");
  return response.data;
};

//ADD THE CUSTOMER

export const addClient = async (data) => {
  const response = await customFetch.post("/userMangement/client", data);
  return response.data;
};

//EDIT CLIENT

export const editClient = async (clientId, data) => {
  const response = await customFetch.put(`/userMangement/clients/${clientId}`, data);
  return response.data;
};

// REMOVE EMPLOYEE
export const removeClient = async (clientId) => {
  const response = await customFetch.delete(`/userMangement/clients/${clientId}`);
  return response.data;
};

//  GET ALL CUSTOMER FROM AHANA_pILOT

export const getAllCustomer = async () =>{
  const response = await customFetch.get("/userMangement/getAllCustomer");
  return response.data;
}