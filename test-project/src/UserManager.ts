// Sample TypeScript file for testing
interface User {
  id: number
  name: string
  email: string
  active: boolean
}

class UserManager {
  private users: User[] = []

  addUser(user: Omit<User, 'id'>): User {
    const newUser: User = {
      id: Date.now(),
      ...user
    }
    this.users.push(newUser)
    return newUser
  }

  getUser(id: number): User | undefined {
    return this.users.find(user => user.id === id)
  }

  getActiveUsers(): User[] {
    return this.users.filter(user => user.active)
  }

  updateUser(id: number, updates: Partial<User>): User | null {
    const userIndex = this.users.findIndex(user => user.id === id)
    if (userIndex === -1) return null

    this.users[userIndex] = { ...this.users[userIndex], ...updates }
    return this.users[userIndex]
  }
}

export { User, UserManager }