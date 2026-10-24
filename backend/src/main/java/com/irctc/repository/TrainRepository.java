package com.irctc.repository;

import com.irctc.entity.Train;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TrainRepository extends JpaRepository<Train, Integer> {

    List<Train> findAllByOrderByTrainNameAsc();

    boolean existsByTrainNumber(String trainNumber);

    boolean existsByTrainNumberAndIdNot(String trainNumber, Integer id);

    /** SELECT ... FOR UPDATE - same row lock the old getTrainByIdForUpdate() used. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select t from Train t where t.id = :id")
    Optional<Train> findByIdForUpdate(@Param("id") Integer id);
}
