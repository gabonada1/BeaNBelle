export const starterBranches = [
	{
		id: "main",
		name: "Main Branch",
		location: "City Center",
		manager: "Bea N Belle Owner"
	},
	{
		id: "north",
		name: "North Branch",
		location: "Northside Market",
		manager: "Mara Lewis"
	}
];

export const starterProducts = [
	{
		id: "P-1001",
		sku: "BB-1001",
		image: "DR",
		name: "Ribbed Knit Dress",
		category: "Dresses",
		price: 420,
		retailPrice: 420,
		resellerPrice: 370,
		costPrice: 260,
		stock: {
			main: 24,
			north: 12
		}
	},
	{
		id: "P-1002",
		sku: "BB-1002",
		image: "BL",
		name: "Signature Blouse",
		category: "Tops",
		price: 280,
		retailPrice: 280,
		resellerPrice: 240,
		costPrice: 155,
		stock: {
			main: 30,
			north: 18
		}
	},
	{
		id: "P-1003",
		sku: "BB-1003",
		image: "SK",
		name: "Pleated Midi Skirt",
		category: "Bottoms",
		price: 350,
		retailPrice: 350,
		resellerPrice: 300,
		costPrice: 190,
		stock: {
			main: 18,
			north: 10
		}
	}
];

export const starterUsers = [
	{
		name: "Mara Lewis",
		username: "mara",
		password: "staff123",
		role: "employee",
		branchId: "north"
	}
];

export const starterSales = [];

export const starterExpenses = [];
