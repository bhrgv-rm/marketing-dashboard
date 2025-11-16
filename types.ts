export interface UserType {
	id: string;
	name: string;
	email: string;
	role?: string;
	image?: string | null;
	createdAt: string | Date;
	updatedAt: string | Date;
	emailVerified: boolean;
}
