USE [shearcomfortCom]
GO
/****** Object:  StoredProcedure [dbo].[UpdateJSON]    Script Date: 9/17/2016 8:08:27 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROCEDURE [dbo].[UpdateJSON]
AS
BEGIN
	SET NOCOUNT ON;

	BEGIN TRY

		-- ############################## Create Exclusion Table ##############################

		-- Temporary table
		DECLARE @Exclude TABLE (ModelId INT, SupplierId INT, Year INT)

		-- Min/Max year for all seats
		DECLARE @MinYear INT = (SELECT MIN(Year1) FROM tblModelSeats)
		DECLARE @MaxYear INT = (SELECT MAX(Year1) FROM tblModelSeats)

		-- Min/Max year for each model
		DECLARE @ModelMin INT
		DECLARE @ModelMax INT

		-- Increment variable
		DECLARE @YearCount INT = 0

		-- Find first/last models with seats
		DECLARE @Model INT = (SELECT TOP(1) ModelId FROM tblModelSeats WHERE ModelId IS NOT NULL ORDER BY ModelId ASC)
		DECLARE @LastModel INT = (SELECT TOP(1) ModelId FROM tblModelSeats WHERE ModelId IS NOT NULL ORDER BY ModelId DESC)

		-- Find first/last supplier with seats
		DECLARE @Supplier INT = (SELECT TOP(1) SupplierId FROM tblModelSeats WHERE SupplierId IS NOT NULL ORDER BY SupplierId ASC)
		DECLARE @LastSupplier INT = (SELECT TOP(1) SupplierId FROM tblModelSeats WHERE SupplierId IS NOT NULL ORDER BY SupplierId DESC)

		-- Search for all year exclusions based on model/supplier
		WHILE (@Supplier <= @LastSupplier)
		BEGIN
			WHILE (@Model <= @LastModel)
			BEGIN
				IF EXISTS (SELECT 1 FROM tblModelSeats WHERE ModelId = @Model AND SupplierId = @Supplier)
				BEGIN
					SET @ModelMin = (SELECT MIN(Year1) FROM tblModelSeats WHERE ModelId = @Model AND SupplierId = @Supplier)
					SET @ModelMax = (SELECT MAX(Year1) FROM tblModelSeats WHERE ModelId = @Model AND SupplierId = @Supplier)

					WHILE ((@YearCount + @MinYear) < @MaxYear)
					BEGIN
						IF ((@YearCount + @MinYear) BETWEEN @ModelMin AND @ModelMax)
						BEGIN
							IF NOT EXISTS (SELECT 1 FROM tblModelSeats WHERE ModelId = @Model AND SupplierId = @Supplier AND (@YearCount + @MinYear) BETWEEN Year1 AND Year2)
							BEGIN
								INSERT INTO @Exclude (ModelId, SupplierId, Year) VALUES (@Model, @Supplier, (@YearCount + @MinYear))
							END
						END

						SET @YearCount = @YearCount + 1
					END
				END

				SET @YearCount = 0
				IF (@Model = @LastModel) BREAK ELSE SET @Model = (SELECT TOP(1) ModelId FROM tblModelSeats WHERE ModelId IS NOT NULL AND ModelId > @Model ORDER BY ModelId ASC)
			END

			SET @Model = (SELECT TOP(1) ModelId FROM tblModelSeats WHERE ModelId IS NOT NULL ORDER BY ModelId ASC)
			IF (@Supplier = @LastSupplier) BREAK ELSE SET @Supplier = (SELECT TOP(1) SupplierId FROM tblModelSeats WHERE SupplierId IS NOT NULL AND SupplierId > @Supplier ORDER BY SupplierId ASC)
		END

		-- ############################## Create Data Tables ##############################

		DECLARE @Makes XML = (
			SELECT
				tblCarMaker.CarMakerId,
				tblCarMaker.CarMaker

			FROM tblCarMaker

			WHERE
				tblCarMaker.CarMakerId IN (SELECT DISTINCT tblModels.MakerId FROM tblModels)

			GROUP BY
				tblCarMaker.CarMakerId,
				tblCarMaker.CarMaker

			FOR XML PATH, ROOT
		)

		DECLARE @Data XML = (
			SELECT
				tblModels.ModelId,
				tblCarMaker.CarMakerId,
				tblModels.ModelName,
				(CASE WHEN (Sheep.Year1 IS NULL) THEN 0 ELSE Sheep.Year1 END) AS 'Sheep1',
				(CASE WHEN (Sheep.Year2 IS NULL) THEN 0 ELSE Sheep.Year2 END) AS 'Sheep2',
				(
					SELECT
						'[' + (
							CASE
								WHEN ((SELECT TOP(1) Year FROM @Exclude WHERE [@Exclude].ModelId = tblModels.ModelId AND SupplierId = 1) IS NULL) THEN ''
								ELSE (
									STUFF(
										(
											SELECT
												',' + CONVERT(VARCHAR(4), Year)
											FROM @Exclude
											WHERE [@Exclude].ModelId = tblModels.ModelId AND SupplierId = 1
											FOR XML PATH('')
										),
										1,
										1,
										''
									)
								)
							END
						) + ']'
				) AS 'SheepExp',

				(CASE WHEN (SCC.Year1 IS NULL) THEN 0 ELSE SCC.Year1 END) AS 'SCC1',
				(CASE WHEN (SCC.Year2 IS NULL) THEN 0 ELSE SCC.Year2 END) AS 'SCC2',
				(
					SELECT
						'[' + (
							CASE
								WHEN ((SELECT TOP(1) Year FROM @Exclude WHERE [@Exclude].ModelId = tblModels.ModelId AND SupplierId = 3) IS NULL) THEN ''
								ELSE (
									STUFF(
										(
											SELECT
												',' + CONVERT(VARCHAR(4), Year)
											FROM @Exclude
											WHERE [@Exclude].ModelId = tblModels.ModelId AND SupplierId = 3
											FOR XML PATH('')
										),
										1,
										1,
										''
									)
								)
							END
						) + ']'
				) AS 'SCCExp',

				(CASE WHEN (Cal.Year1 IS NULL) THEN 0 ELSE Cal.Year1 END) AS 'Cal1',
				(CASE WHEN (Cal.Year2 IS NULL) THEN 0 ELSE Cal.Year2 END) AS 'Cal2',
				(
					SELECT
						'[' + (
							CASE
								WHEN ((SELECT TOP(1) Year FROM @Exclude WHERE [@Exclude].ModelId = tblModels.ModelId AND SupplierId = 4) IS NULL) THEN ''
								ELSE (
									STUFF(
										(
											SELECT
												',' + CONVERT(VARCHAR(4), Year)
											FROM @Exclude
											WHERE [@Exclude].ModelId = tblModels.ModelId AND SupplierId = 4
											FOR XML PATH('')
										),
										1,
										1,
										''
									)
								)
							END
						) + ']'
				) AS 'CalExp',

				(CASE WHEN tblModels.Parent_ModelId IS NOT NULL THEN tblModels.Parent_ModelId ELSE 0 END) AS 'ParentId'

			FROM tblModels

			INNER JOIN tblCarMaker ON tblCarMaker.CarMakerId = tblModels.MakerId

			LEFT OUTER JOIN (
				SELECT
					tblModelSeats.ModelId,
					MIN(tblModelSeats.Year1) AS 'Year1',
					(MAX(tblModelSeats.Year2) - MIN(tblModelSeats.Year1)) AS 'Year2' -- Send the difference for better bandwidth usage.
  
				FROM tblModelSeats

				WHERE
					tblModelSeats.Active = 1 AND
					tblModelSeats.SupplierId = 1

				GROUP BY
					tblModelSeats.ModelId
			) Sheep ON Sheep.ModelId = tblModels.ModelId

			LEFT OUTER JOIN (
				SELECT
					tblModelSeats.ModelId,
					MIN(tblModelSeats.Year1) AS 'Year1',
					(MAX(tblModelSeats.Year2) - MIN(tblModelSeats.Year1)) AS 'Year2' -- Send the difference for better bandwidth usage.
  
				FROM tblModelSeats

				WHERE
					tblModelSeats.Active = 1 AND
					tblModelSeats.SupplierId = 3

				GROUP BY
					tblModelSeats.ModelId
			) SCC ON SCC.ModelId = tblModels.ModelId

			LEFT OUTER JOIN (
				SELECT
					tblModelSeats.ModelId,
					MIN(tblModelSeats.Year1) AS 'Year1',
					(MAX(tblModelSeats.Year2) - MIN(tblModelSeats.Year1)) AS 'Year2' -- Send the difference for better bandwidth usage.
  
				FROM tblModelSeats

				WHERE
					tblModelSeats.Active = 1 AND
					tblModelSeats.SupplierId = 4

				GROUP BY
					tblModelSeats.ModelId
			) Cal ON Cal.ModelId = tblModels.ModelId

			WHERE
				((Sheep.Year1 IS NOT NULL) OR (SCC.Year1 IS NOT NULL) OR (Cal.Year1 IS NOT NULL)) -- Must have seats

			FOR XML PATH, ROOT
		)

		-- ############################## Output Data ##############################

		INSERT INTO tbltempJson

		SELECT
			'{"models":[' +
			STUFF(
				(
					SELECT * FROM (
						SELECT
							',[' +
							STUFF(
								(
									SELECT
										CONCAT(
											(
												CASE
													WHEN (((ISNUMERIC(b.c.value('text()[1]','VARCHAR(MAX)')) = 1) OR (LEFT(b.c.value('text()[1]','VARCHAR(MAX)'), 1) = '[')) AND (b.c.value('local-name(.)', 'VARCHAR(MAX)') != 'ModelName')) THEN ','
													ELSE ',"'
												END
											),
											b.c.value('text()[1]','VARCHAR(MAX)'),
											(
												CASE
													WHEN (((ISNUMERIC(b.c.value('text()[1]','VARCHAR(MAX)')) = 0) AND (RIGHT(b.c.value('text()[1]','VARCHAR(MAX)'), 1) != ']')) OR (b.c.value('local-name(.)', 'VARCHAR(MAX)') = 'ModelName')) THEN '"'
												END
											)
										)

									FROM x.a.nodes('*') b(c)
									FOR XML PATH(''), TYPE
								).value('text()[1]','VARCHAR(MAX)'),
								1,
								1,
								''
							)
							+ ']'

						FROM @Data.nodes('/root/*') x(a)
					) JSON(Data)
					FOR XML PATH(''), TYPE
				).value('.', 'VARCHAR(MAX)'),
				1,
				1,
				''
			) + '],"makes":[' +
			STUFF(
				(
					SELECT * FROM (
						SELECT
							',[' +
							STUFF(
								(
									SELECT
										CONCAT(
											(
												CASE
													WHEN ((ISNUMERIC(b.c.value('text()[1]','VARCHAR(MAX)')) = 1) OR (LEFT(b.c.value('text()[1]','VARCHAR(MAX)'), 1) = '[')) THEN ','
													ELSE ',"'
												END
											),
											b.c.value('text()[1]','VARCHAR(MAX)'),
											(
												CASE
													WHEN ((ISNUMERIC(b.c.value('text()[1]','VARCHAR(MAX)')) = 0) AND (RIGHT(b.c.value('text()[1]','VARCHAR(MAX)'), 1) != ']')) THEN '"'
												END
											)
										)

									FROM x.a.nodes('*') b(c)
									FOR XML PATH(''), TYPE
								).value('text()[1]','VARCHAR(MAX)'),
								1,
								1,
								''
							)
							+ ']'

						FROM @Makes.nodes('/root/*') x(a)
					) JSON(Data)
					FOR XML PATH(''), TYPE
				).value('.', 'VARCHAR(MAX)'),
				1,
				1,
				''
			) + ']}'

		EXEC xp_cmdshell 'bcp "SELECT LEFT([tbltempJson].[result], (LEN([tbltempJson].[result]) - 1)) FROM [shearcomfortCom].[dbo].[tbltempJson]" queryout "C:\inetpub\wwwroot\assets\json\models.json" -c -T -r }'

		TRUNCATE TABLE tbltempJson

	END TRY
	
	BEGIN CATCH
		EXEC usp_GetErrorInfo
	END CATCH
	
END