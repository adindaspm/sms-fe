const axios = require('axios');
const { getCache, setCache } = require('../utils/cacheService');
const { apiBaseUrl } = require('../config');
const { getAllDeputis } = require('../services/deputiService');
const { getAllDirektorats } = require('../services/direktoratService');
const { getAllProvinces } = require('../services/provinceService');
const { getAllRoles } = require('../services/roleService');
const { getAllSatkers } = require('../services/satkerService');
const { getAllUsers, saveUser, getUserById, getRolesByUser, assignUserRole, removeUserRole, updateUser, activateUser, deactivateUser } = require('../services/userService');
const { delCache } = require('../utils/cacheService');


exports.index = async (req, res) => {
  try {
    const token = req.session.user?.accessToken;
    if (!token) return res.redirect('/login');

    const userDtos = await getAllUsers(token);
    res.render('layout', { title: 'Pengguna | SMS', page: 'pages/manajemenPengguna', activePage: 'users', userDtos });
  } catch (error) {
    req.session.errorMessage = 'Gagal mengambil data pengguna.';
    res.redirect(req.get('Referer'));
  }
};

exports.renderAddForm = async (req) => {
  const token = req.session.user?.accessToken;
  const [provinceDtos, satkerDtos, deputiDtos, direktoratDtos] = await Promise.all([
      getAllProvinces(token), getAllSatkers(token), getAllDeputis(token), getAllDirektorats(token)
    ]);
  
  return {
    title: 'Tambah Pengguna | SMS',
    page: 'pages/addPengguna',
    activePage: 'users',
    listProvinces: provinceDtos,
    listSatkers: satkerDtos,
    listDeputis: deputiDtos,
    listDirektorats: direktoratDtos
  }
};

exports.addForm = async (req, res) => {
  try {
    const token = req.session.user?.accessToken;
    if (!token) return res.redirect('/login');

    const [provinceDtos, satkerDtos, deputiDtos, direktoratDtos] = await Promise.all([
      getAllProvinces(token), getAllSatkers(token), getAllDeputis(token), getAllDirektorats(token)
    ]);

    res.render('layout', {
      title: 'Tambah Pengguna | SMS',
      page: 'pages/addPengguna',
      activePage: 'users',
      listProvinces: provinceDtos,
      listSatkers: satkerDtos,
      listDeputis: deputiDtos,
      listDirektorats: direktoratDtos,
      old: null,
      errors: null
    });
  } catch (err) {
    console.error(err);
    res.redirect(req.get('Referer'));
  }
};

exports.save = async (req, res) => {
  try {
    const token = req.session.user?.accessToken;
    if (!token) return res.redirect('/login');

    const { first_name, last_name, nip, email, satker, direktorat } = req.body;
    const payload = {
      firstName: first_name,
      lastName: last_name,
      nip,
      email,
      password: nip,
      satker: JSON.parse(decodeURIComponent(satker)),
      direktorat: JSON.parse(decodeURIComponent(direktorat)),
      isActive: true
    };

    await saveUser(payload, token);
    await delCache('all_users');
    req.session.successMessage = 'Pengguna berhasil ditambahkan.';
    res.redirect('/users');
  } catch (err) {
    req.session.errorMessage = 'Gagal menambahkan pengguna.';
    res.redirect(req.get('Referer'));
  }
};

exports.detail = async (req, res) => {
  try {
    const token = req.session.user?.accessToken;
    if (!token) return res.redirect('/login');

    const userId = req.params.id;
    const userData = await getUserById(userId, token);
    const userRoles = (await getRolesByUser(userId, token)).map(role => ({
      name: role.name.replace('ROLE_', '')
    }));

    res.json({ id: userId, ...userData, roles: userRoles });
  } catch (err) {
    req.session.errorMessage = 'Gagal mengambil data user.';
  }
};

exports.activate = async (req, res) => {
  try {
    await updateUserStatus(req, res, true);
  } catch (error) {
    
  } 
};

exports.deactivate = async (req, res) => {
  await updateUserStatus(req, res, false);
};

async function updateUserStatus(req, res, isActive) {
  try {
    const token = req.session.user?.accessToken;
    if (!token) return res.redirect('/login');

    const { id } = req.params;
    await (isActive ? activateUser(id, token) : deactivateUser(id, token));
    await Promise.all([delCache(`user_${id}`), delCache('all_users')]);

    res.status(200).send('Ganti status berhasil')
  } catch (err) {
    console.log(err);
    res.status(500).send('Internal server error');
  }
}

exports.roleForm = async (req, res) => {
  try {
    const token = req.session.user?.accessToken;
    const userId = req.params.id;

    const [userDto, roleDtos, userRoleDtos] = await Promise.all([
      getUserById(userId, token),
      getAllRoles(token),
      getRolesByUser(userId, token)
    ]);

    res.render('layout', {
      title: 'Kelola Peran Pengguna | SMS',
      page: 'pages/kelolaPeran',
      activePage: 'users',
      userDto, roleDtos, userRoleDtos
    });
  } catch (err) {
    console.log(err);
    req.session.errorMessage = 'Gagal memuat form.';
    res.status(500).send('Internal Server Error');
  }
};

exports.assignRole = async (req, res) => {
  try {
    const token = req.session.user?.accessToken;
    const { id } = req.params;
    const { roleId } = req.body;

    await assignUserRole(id, roleId, token);
    await delCache(`rolesByUser_${id}`);
    req.session.successMessage = 'Berhasil menambah role pengguna.';
    res.redirect(`/users/${id}/roles`);
  } catch (err) {
    console.log(err);
    req.session.errorMessage = 'Gagal menambahkan role pengguna.';
    res.redirect(req.get('Referer'));
  }
};

exports.removeRole = async (req, res) => {
  try {
    const token = req.session.user?.accessToken;
    const { id } = req.params;
    const { roleId } = req.body;

    await removeUserRole(id, roleId, token);
    await delCache(`rolesByUser_${id}`);
    req.session.successMessage = 'Berhasil menghapus role pengguna.';
    res.redirect(`/users/${id}/roles`);
  } catch (err) {
    console.log(err);
    req.session.errorMessage = 'Gagal menghapus role pengguna.';
    res.redirect(`/users/${id}/roles`);
  }
};

exports.renderUpdateForm = async (req) => {
  const token = req.session.user?.accessToken;
  const { id } = req.params;

  const [provinceDtos, satkerDtos, deputiDtos, direktoratDtos, user] = await Promise.all([
    getAllProvinces(token), getAllSatkers(token), getAllDeputis(token), getAllDirektorats(token), getUserById(id, token)
  ]);

  return {
    title: 'Perbarui Data Pengguna | SMS',
    page: 'pages/updatePengguna',
    activePage: 'users',
    listProvinces: provinceDtos,
    listSatkers: satkerDtos,
    listDeputis: deputiDtos,
    listDirektorats: direktoratDtos,
    user
  }
};

exports.updateForm = async (req, res) => {
  try {
    const token = req.session.user?.accessToken;
    const { id } = req.params;

    const [provinceDtos, satkerDtos, deputiDtos, direktoratDtos, user] = await Promise.all([
      getAllProvinces(token), getAllSatkers(token), getAllDeputis(token), getAllDirektorats(token), getUserById(id, token)
    ]);

    res.render('layout', {
      title: 'Perbarui Data Pengguna | SMS',
      page: 'pages/updatePengguna',
      activePage: 'users',
      listProvinces: provinceDtos,
      listSatkers: satkerDtos,
      listDeputis: deputiDtos,
      listDirektorats: direktoratDtos,
      user,
      old: null,
      errors: null
    });
  } catch (err) {
    console.log(err);
    res.redirect(req.get('Referer'));
  }
};

exports.update = async (req, res) => {
  try {
    const token = req.session.user?.accessToken;
    const { id } = req.params;
    const { name, nip, email, satker, direktorat } = req.body;

    const payload = {
      name,
      nip,
      email,
      satker: JSON.parse(decodeURIComponent(satker)),
      direktorat: JSON.parse(decodeURIComponent(direktorat))
    };

    await updateUser(id, payload, token);
    await Promise.all([
      delCache('all_users'),
      delCache(`user_${id}`),
      delCache(`satkerByUser_${id}`),
      delCache(`direktoratByUser_${id}`)
    ]);

    req.session.successMessage = 'Pengguna berhasil diperbarui.';
    res.redirect('/users');
  } catch (err) {
    console.log(err);
    req.session.errorMessage = 'Gagal memperbarui data pengguna.';
    res.redirect('/users');
  }
};
