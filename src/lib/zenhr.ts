// ZenHR API Integration Module
// This module handles all interactions with the ZenHR API

interface ZenHREmployee {
  id: string;
  name: string;
  email: string;
  department: string;
  position: string;
  hireDate: string;
  status: string;
}

interface ZenHRAttendance {
  employeeId: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: 'present' | 'absent' | 'late' | 'half_day';
}

interface ZenHRRequest {
  id?: string;
  employeeId: string;
  type: string;
  title: string;
  description: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}

class ZenHRAPI {
  private baseURL: string;
  private apiKey: string;

  constructor() {
    this.baseURL = process.env.ZENHR_API_URL || 'https://api.zenhr.com/v1';
    this.apiKey = process.env.ZENHR_API_KEY || '';
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`ZenHR API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('ZenHR API Request Failed:', error);
      throw error;
    }
  }

  // Employee Management
  async fetchEmployeeData(employeeId: string): Promise<ZenHREmployee> {
    try {
      // Mock implementation - replace with actual ZenHR API call
      if (!this.apiKey) {
        return this.mockEmployeeData(employeeId);
      }
      
      return await this.makeRequest(`/employees/${employeeId}`);
    } catch (error) {
      console.error('Failed to fetch employee data:', error);
      throw new Error('Unable to fetch employee data from ZenHR');
    }
  }

  async fetchAllEmployees(companyId?: string): Promise<ZenHREmployee[]> {
    try {
      // Mock implementation - replace with actual ZenHR API call
      if (!this.apiKey) {
        return this.mockEmployeesList();
      }

      const endpoint = companyId ? `/companies/${companyId}/employees` : '/employees';
      return await this.makeRequest(endpoint);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
      throw new Error('Unable to fetch employees from ZenHR');
    }
  }

  // Attendance Management
  async markAttendance(attendanceData: ZenHRAttendance): Promise<any> {
    try {
      // Mock implementation - replace with actual ZenHR API call
      if (!this.apiKey) {
        return this.mockAttendanceResponse(attendanceData);
      }

      return await this.makeRequest('/attendance', {
        method: 'POST',
        body: JSON.stringify(attendanceData),
      });
    } catch (error) {
      console.error('Failed to mark attendance:', error);
      throw new Error('Unable to mark attendance in ZenHR');
    }
  }

  async fetchAttendanceRecords(employeeId: string, startDate: string, endDate: string): Promise<ZenHRAttendance[]> {
    try {
      // Mock implementation - replace with actual ZenHR API call
      if (!this.apiKey) {
        return this.mockAttendanceRecords(employeeId, startDate, endDate);
      }

      return await this.makeRequest(`/attendance/${employeeId}?start=${startDate}&end=${endDate}`);
    } catch (error) {
      console.error('Failed to fetch attendance records:', error);
      throw new Error('Unable to fetch attendance records from ZenHR');
    }
  }

  // HR Requests Management
  async submitHRRequest(requestData: ZenHRRequest): Promise<any> {
    try {
      // Mock implementation - replace with actual ZenHR API call
      if (!this.apiKey) {
        return this.mockHRRequestResponse(requestData);
      }

      return await this.makeRequest('/hr-requests', {
        method: 'POST',
        body: JSON.stringify(requestData),
      });
    } catch (error) {
      console.error('Failed to submit HR request:', error);
      throw new Error('Unable to submit HR request to ZenHR');
    }
  }

  async fetchHRRequests(employeeId?: string): Promise<ZenHRRequest[]> {
    try {
      // Mock implementation - replace with actual ZenHR API call
      if (!this.apiKey) {
        return this.mockHRRequestsList(employeeId);
      }

      const endpoint = employeeId ? `/hr-requests?employee=${employeeId}` : '/hr-requests';
      return await this.makeRequest(endpoint);
    } catch (error) {
      console.error('Failed to fetch HR requests:', error);
      throw new Error('Unable to fetch HR requests from ZenHR');
    }
  }

  async updateHRRequestStatus(requestId: string, status: string, comments?: string): Promise<any> {
    try {
      // Mock implementation - replace with actual ZenHR API call
      if (!this.apiKey) {
        return this.mockUpdateHRRequestResponse(requestId, status);
      }

      return await this.makeRequest(`/hr-requests/${requestId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, comments }),
      });
    } catch (error) {
      console.error('Failed to update HR request status:', error);
      throw new Error('Unable to update HR request status in ZenHR');
    }
  }

  // Mock implementations for development/testing
  private mockEmployeeData(employeeId: string): ZenHREmployee {
    return {
      id: employeeId,
      name: `Employee ${employeeId}`,
      email: `employee${employeeId}@company.com`,
      department: 'Engineering',
      position: 'Software Developer',
      hireDate: '2023-01-15',
      status: 'active'
    };
  }

  private mockEmployeesList(): ZenHREmployee[] {
    return [
      {
        id: '1',
        name: 'John Doe',
        email: 'john.doe@company.com',
        department: 'Engineering',
        position: 'Senior Developer',
        hireDate: '2022-03-15',
        status: 'active'
      },
      {
        id: '2',
        name: 'Jane Smith',
        email: 'jane.smith@company.com',
        department: 'HR',
        position: 'HR Manager',
        hireDate: '2021-08-20',
        status: 'active'
      }
    ];
  }

  private mockAttendanceResponse(attendanceData: ZenHRAttendance): any {
    return {
      success: true,
      message: 'Attendance marked successfully',
      data: {
        ...attendanceData,
        id: `att_${Date.now()}`,
        timestamp: new Date().toISOString()
      }
    };
  }

  private mockAttendanceRecords(employeeId: string, startDate: string, endDate: string): ZenHRAttendance[] {
    const records: ZenHRAttendance[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      records.push({
        employeeId,
        date: d.toISOString().split('T')[0],
        checkIn: '09:00:00',
        checkOut: '17:00:00',
        status: 'present'
      });
    }
    
    return records;
  }

  private mockHRRequestResponse(requestData: ZenHRRequest): any {
    return {
      success: true,
      message: 'HR request submitted successfully',
      data: {
        ...requestData,
        id: `req_${Date.now()}`,
        status: 'pending',
        createdAt: new Date().toISOString()
      }
    };
  }

  private mockHRRequestsList(employeeId?: string): ZenHRRequest[] {
    return [
      {
        id: 'req_1',
        employeeId: employeeId || '1',
        type: 'leave',
        title: 'Annual Leave Request',
        description: 'Requesting 5 days annual leave',
        startDate: '2024-02-15',
        endDate: '2024-02-19',
        status: 'pending'
      },
      {
        id: 'req_2',
        employeeId: employeeId || '1',
        type: 'document_request',
        title: 'Salary Certificate',
        description: 'Need salary certificate for bank loan',
        status: 'approved'
      }
    ];
  }

  private mockUpdateHRRequestResponse(requestId: string, status: string): any {
    return {
      success: true,
      message: 'HR request status updated successfully',
      data: {
        id: requestId,
        status,
        updatedAt: new Date().toISOString()
      }
    };
  }
}

// Export singleton instance
export const zenhrAPI = new ZenHRAPI();

// Export types for use in other modules
export type { ZenHREmployee, ZenHRAttendance, ZenHRRequest };
