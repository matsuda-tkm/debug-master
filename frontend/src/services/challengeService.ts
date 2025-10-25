import { Challenge } from '../types/challenge';

const API_BASE_URL = 'http://localhost:8000';

class ChallengeService {
  async getAllChallenges(): Promise<Challenge[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/challenges`);
      if (!response.ok) {
        throw new Error(`Failed to fetch challenges: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching challenges:', error);
      throw error;
    }
  }

  async getChallengeById(id: string): Promise<Challenge> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/challenges/${id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch challenge: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching challenge ${id}:`, error);
      throw error;
    }
  }

  async createChallenge(challenge: Challenge): Promise<Challenge> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/challenges`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(challenge),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create challenge: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating challenge:', error);
      throw error;
    }
  }

  async updateChallenge(id: string, challenge: Partial<Challenge>): Promise<Challenge> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/challenges/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(challenge),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update challenge: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error updating challenge ${id}:`, error);
      throw error;
    }
  }

  async deleteChallenge(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/challenges/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete challenge: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Error deleting challenge ${id}:`, error);
      throw error;
    }
  }
}

export const challengeService = new ChallengeService();