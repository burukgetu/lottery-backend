import prisma from "../config/db.js";

export const getWinners = async (req, res) => {
  console.log("Getting winners");
  const { search = '', page = 0, limit = 5, startOfWeek, endOfWeek } = req.query;

  try {
    const whereClause = {
      OR: [
        {
          receipt: {
            user: {
              firstName: {
                contains: search,
                mode: 'insensitive'
              }
            }
          }
        },
        {
          receipt: {
            user: {
              lastName: {
                contains: search,
                mode: 'insensitive'
              }
            }
          }
        },
        {
          receipt: {
            uniqueCode: {
              contains: search
            }
          }
        },
        {
          receipt: {
            tinNumber: {
              contains: search
            }
          }
        }
      ]
    };

    // Add date range filtering if startOfWeek and endOfWeek are provided
    if (startOfWeek && endOfWeek) {
      whereClause.createdAt = {
        gte: new Date(startOfWeek), // start of the week
        lte: new Date(endOfWeek),   // end of the week
      };
    }

    const winners = await prisma.winner.findMany({
      where: whereClause,
      skip: page * limit,
      take: parseInt(limit),
      include: {
        receipt: {
          include: {
            user: true
          }
        }
      }
    });

    const total = await prisma.winner.count({
      where: whereClause
    });

    res.json({
      winners: winners.map(winner => ({
        lotNumber: winner.receipt.uniqueCode,
        firstName: winner.receipt.user.firstName,
        lastName: winner.receipt.user.lastName,
      })),
      total,
    });
  } catch (error) {
    console.error('Error fetching lot winners:', error);
    res.status(500).json({ error: 'Error fetching lot winners' });
  }
};