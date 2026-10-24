package com.irctc.repository;

import com.irctc.entity.TrainStop;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TrainStopRepository extends JpaRepository<TrainStop, Integer> {

    @Query("select s from TrainStop s where s.trainId = :trainId " +
           "and (s.stationName = :name or s.stationCode = :code) order by s.stopNumber")
    List<TrainStop> findStop(@Param("trainId") Integer trainId,
                             @Param("name") String name,
                             @Param("code") String code);

    boolean existsByTrainId(Integer trainId);
}
