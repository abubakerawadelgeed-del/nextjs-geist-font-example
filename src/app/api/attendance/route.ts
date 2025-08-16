import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { zenhrAPI } from '@/lib/zenhr'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { date, checkIn, checkOut, status, notes, location } = body

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 })
    }

    // Mark attendance in ZenHR
    const zenhrResponse = await zenhrAPI.markAttendance({
      employeeId: session.user.employeeId,
      date,
      checkIn,
      checkOut,
      status: status || 'present'
    })

    // Save attendance record in local database
    const attendance = await prisma.attendance.create({
      data: {
        employeeId: session.user.id,
        date: new Date(date),
        checkIn: checkIn ? new Date(`${date}T${checkIn}`) : new Date(),
        checkOut: checkOut ? new Date(`${date}T${checkOut}`) : null,
        status: status || 'PRESENT',
        notes,
        location
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Attendance marked successfully',
      data: {
        attendance,
        zenhrResponse
      }
    })

  } catch (error) {
    console.error('Attendance API error:', error)
    return NextResponse.json(
      { error: 'Failed to mark attendance' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const employeeId = searchParams.get('employeeId')

    // If manager/admin requesting specific employee data
    const targetEmployeeId = employeeId && (session.user.role === 'MANAGER' || session.user.role === 'ADMIN') 
      ? employeeId 
      : session.user.id

    const whereClause: any = {
      employeeId: targetEmployeeId
    }

    if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    const attendanceRecords = await prisma.attendance.findMany({
      where: whereClause,
      include: {
        employee: {
          select: {
            name: true,
            email: true,
            employeeId: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: attendanceRecords
    })

  } catch (error) {
    console.error('Attendance fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch attendance records' },
      { status: 500 }
    )
  }
}
