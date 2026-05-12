const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

exports.register = async (req, res) => {
  const { email, password, name } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Este e-mail já está cadastrado.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    
    // ECC: Create Company first, then the User
    const company = await prisma.company.create({
      data: { name: `Company of ${name}` }
    });

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        companyId: company.id
      }
    });

    const token = jwt.sign({ userId: user.id, companyId: user.companyId }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ 
      token, 
      user: { id: user.id, email: user.email, name: user.name, companyId: user.companyId } 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar conta.' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
    }

    const token = jwt.sign({ userId: user.id, companyId: user.companyId }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({ 
      token, 
      user: { id: user.id, email: user.email, name: user.name, companyId: user.companyId } 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao fazer login.' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, email: true, name: true, createdAt: true }
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar perfil.' });
  }
};

exports.updateProfile = async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Nome não pode estar vazio.' });
  }
  try {
    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: { name: name.trim() },
      select: { id: true, email: true, name: true }
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar perfil.' });
  }
};

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'Dados inválidos. A nova senha deve ter pelo menos 6 caracteres.' });
  }
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Senha atual incorreta.' });
    }
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: req.user.userId },
      data: { passwordHash }
    });
    res.json({ message: 'Senha alterada com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao alterar senha.' });
  }
};
