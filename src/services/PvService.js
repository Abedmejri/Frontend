import axiosClient from "./axios-client";

export const PvService = {
  // Fetch all PVs
  fetchPVs: async () => {
    try {
      const { data } = await axiosClient.get("/pvs");
      return data;
    } catch (error) {
      throw new Error("Failed to fetch PVs");
    }
  },

  // Create a new PV
  createPV: async (values) => {
    try {
      const response = await axiosClient.post("/pvs", values);
      return response.data;
    } catch (error) {
      throw new Error("Failed to create PV");
    }
  },

  // Update an existing PV
  updatePV: async (id, values) => {
    try {
      const response = await axiosClient.put(`/pvs/${id}`, values);  // PUT request to update the PV
      return response.data;
    } catch (error) {
      throw new Error("Failed to update PV");
    }
  },

  // Delete a PV
  deletePV: async (pvId) => {
    try {
      await axiosClient.delete(`/pvs/${pvId}`);
    } catch (error) {
      throw new Error("Failed to delete PV");
    }
  },

  // Fetch all meetings
  fetchMeetings: async () => {
    try {
      const { data } = await axiosClient.get("/meetings");
      return data;
    } catch (error) {
      throw new Error("Failed to fetch meetings");
    }
  },

  // Create a new meeting
  createMeeting: async (values) => {
    try {
      const response = await axiosClient.post("/meetings", values);
      return response.data;
    } catch (error) {
      throw new Error("Failed to create meeting");
    }
  },

  // Delete a meeting
  deleteMeeting: async (meetingId) => {
    try {
      await axiosClient.delete(`/meetings/${meetingId}`);
    } catch (error) {
      throw new Error("Failed to delete meeting");
    }
  },

  // Fetch all commissions
  fetchCommissions: async () => {
    try {
      const { data } = await axiosClient.get("/commissions");
      return data;
    } catch (error) {
      throw new Error("Failed to fetch commissions");
    }
  },

  // Fetch all users
  fetchUsers: async () => {
    try {
      const { data } = await axiosClient.get("/users");
      return data;
    } catch (error) {
      throw new Error("Failed to fetch users");
    }
  },

  // Generate a Text file for a PV
  generateText: async (pvId) => {
    try {
      const response = await axiosClient.post("/pvs/generate-text", { pv_id: pvId }, { responseType: 'blob' });
      return response.data;  // This will be the text file blob data
    } catch (error) {
      throw new Error("Failed to generate text file");
    }
  },
};
