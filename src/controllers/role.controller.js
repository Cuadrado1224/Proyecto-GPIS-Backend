import Role from "../models/role.model.js";

export const getAllRoles = async (req, res) => {
  try {
    const roles = await Role.findAll();
    res.json(roles);
  } catch (error) {
    res.status(500).json({ message: "Error fetching roles", error });
  }
};

export const getRoleById = async (req, res) => {
  try {
    const role = await Role.findByPk(req.params.id);
    if (!role) return res.status(404).json({ message: "Role not found" });
    res.json(role);
  } catch (error) {
    res.status(500).json({ message: "Error fetching role", error });
  }
};

export const createRole = async (req, res) => {};
export const updateRole = async (req, res) => {};
export const deleteRole = async (req, res) => {};
