import { injectable, inject } from "tsyringe";
import { ICallback } from "../../@types/Proto";
import IPharmacyRepository from "../repositories/IPharmacyRepository";
import { IPharmacyService } from "./IPharmacyService";

@injectable()
export class PharmacyService implements IPharmacyService {
	constructor(
		@inject("PharmacyRepository")
		private pharmacyRepository: IPharmacyRepository
	) {}

	async getPharmacy(
		call: Record<string, any>,
		callback: ICallback
	): Promise<void> {
		const { id } = call.request;

		const pharmacy = await this.pharmacyRepository.getById(id);

		if (!pharmacy) {
			return callback(new Error("Pharmacy not found!"), null);
		}

		return callback(null, {
			...pharmacy,
			createdAt: pharmacy.createdAt.toISOString(),
			updatedAt: pharmacy.updatedAt.toISOString(),
		});
	}

	async getAllPharmacies(
		call: Record<string, any>,
		callback: ICallback
	): Promise<void> {
		const { pharmacies, totalPharmacies } =
			await this.pharmacyRepository.getAll();

		const parsedPharmacies = pharmacies.map((pharmacy) => ({
			...pharmacy,
			createdAt: pharmacy.createdAt.toISOString(),
			updatedAt: pharmacy.updatedAt.toISOString(),
		}));

		return callback(null, { pharmacies: parsedPharmacies, totalPharmacies });
	}

	async createPharmacy(
		call: Record<string, any>,
		callback: ICallback
	): Promise<void> {
		const { name } = call.request;

		const pharmacyFound = await this.pharmacyRepository.getAllByName(name);

		if (pharmacyFound.length > 0) {
			if (pharmacyFound.length > 3) {
				return callback(new Error("Maximum subsidiaries reached"), null);
			}
			const pharmacy = await this.pharmacyRepository.save(call.request);

			console.log({ ...pharmacy, createdAt: pharmacy.createdAt.toISOString() });

			return callback(null, {
				...pharmacy,
				createdAt: pharmacy.createdAt.toISOString(),
				updatedAt: pharmacy.updatedAt.toISOString(),
				isSubsidiary: true,
			});
		}

		const pharmacy = await this.pharmacyRepository.save(call.request);

		return callback(null, {
			...pharmacy,
			createdAt: pharmacy.createdAt.toISOString(),
			updatedAt: pharmacy.updatedAt.toISOString(),
		});
	}

	async updatePharmacy(
		call: Record<string, any>,
		callback: ICallback
	): Promise<void> {
		const { id, ...request } = call.request;

		const pharmacyFound = await this.pharmacyRepository.getById(id);

		if (!pharmacyFound) {
			return callback(new Error("Pharmacy not found!"), null);
		}

		// Remove itens if they are falsy values (gRPC default values)
		for (let item in request) {
			if (!request[item]) {
				delete request[item];
			}
		}

		const partialPharmacy = await this.pharmacyRepository.update(id, request);

		return callback(null, {
			...partialPharmacy,
			createdAt: partialPharmacy?.createdAt?.toISOString() || "",
			updatedAt: partialPharmacy?.updatedAt?.toISOString() || "",
		});
	}

	async deletePharmacy(
		call: Record<string, any>,
		callback: ICallback
	): Promise<void> {
		const { id } = call.request;

		const pharmacyFound = await this.pharmacyRepository.getById(id);

		if (!pharmacyFound) {
			return callback(new Error("Pharmacy not found!"), null);
		}

		await this.pharmacyRepository.delete(id);

		return callback(null, {});
	}
}
