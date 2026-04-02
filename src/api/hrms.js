import customFetch from "./axios"

export const getAllEmployees = async () => {
    try {
        const res = await customFetch.post('/api/hrms/getAllAhanaEmplist');
        return res.data.data;
    } catch (error) {
        console.log(error);
        return [];
    }
}