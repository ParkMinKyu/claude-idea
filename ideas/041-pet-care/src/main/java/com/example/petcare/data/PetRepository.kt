package com.example.petcare.data

import kotlinx.coroutines.flow.Flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class PetRepository @Inject constructor(private val dao: PetDao) {

    fun observePets(): Flow<List<Pet>> = dao.observePets()

    suspend fun addPet(name: String, species: String, breed: String? = null): Long {
        require(name.isNotBlank())
        require(species in listOf("dog", "cat", "other"))
        return dao.insertPet(Pet(name = name.trim(), species = species, breed = breed))
    }

    suspend fun addDiary(petId: Long, date: String, note: String, walkMin: Int? = null,
                         foodGram: Int? = null): Long {
        require(note.isNotBlank() || walkMin != null || foodGram != null) {
            "Must have at least one field"
        }
        return dao.insertEntry(DiaryEntry(petId = petId, date = date, note = note,
            walkMinutes = walkMin, foodGram = foodGram))
    }

    suspend fun averageWalk(petId: Long): Double = dao.averageWalkMinutes(petId) ?: 0.0
}
