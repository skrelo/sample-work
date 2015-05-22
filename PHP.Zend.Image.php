<?php


	class App_Utilities_ImageCrop {

		const DESIRED_IMAGE_WIDTH = 200;
		const DESIRED_IMAGE_HEIGHT = 200;

		public static function ImageScaleAndCrop( $newwidth, $newheight, $infile, $outfile ) {
			clearstatcache();
			if ( !is_file( $infile ) ) throw new Zend_Exception( "In file not a file {$infile}" );

			if ( !extension_loaded( 'imagick' ) ) {
				list( $width, $height, $type ) = getimagesize( $infile );
				switch ( $type ) {
					case IMAGETYPE_GIF:
						$src = imagecreatefromgif( $infile );
						$outfunc = "imagegif";
						$ext = "gif";
						$quality = null;
						break;
					case IMAGETYPE_JPEG:
						$src = imagecreatefromjpeg( $infile );
						$outfunc = "imagejpeg";
						$ext = "jpg";
						$quality = 90;
						break;
					case IMAGETYPE_PNG:
						$src = imagecreatefrompng( $infile );
						$outfunc = "imagepng";
						$ext = "png";
						$quality = 8;
						break;
				}
				if ( $src === false ) {
					throw new Zend_Exception( "In file not a file {$infile}" );
					return false;
				}
				$ratio = $width / $height;

				if ( $width / $height > $ratio ) {
					$width = $height * $ratio;
				} else {
					$height = $width / $ratio;
				}

				$dst = imagecreatetruecolor( $newwidth, $newheight );
				if ( $ext == "png" ) {
					imagealphablending( $dst, FALSE );
					imagesavealpha( $dst, TRUE );
					$transparent = imagecolorallocatealpha( $dst, 255, 255, 255, 127 );
					imagefilledrectangle( $dst, 0, 0, $newwidth, $newheight, $transparent );
				}
				imagecopyresampled( $dst, $src, 0, 0, 0, 0, $newwidth, $newheight, $width, $height );
				@unlink( $outfile . "." . $ext );
				$outfunc( $dst, $outfile . "." . $ext, $quality );
				$src = $dst;

				return $ext;
			} else {

				$image = new Imagick();
				$image->readImage( $infile );
				parent::$imageType = $image->getimageformat();
				$props = $image->getimagegeometry();
				$image->scaleimage( $newwidth, 0 );

				$image->writeimage( $outfile );
			}
		}

		public static function ImageCrop( $source_path, $dest_path ) {

			list( $source_width, $source_height, $source_type ) = getimagesize( $source_path );

			switch ( $source_type ) {
				case IMAGETYPE_GIF:
					$source_gdim = imagecreatefromgif( $source_path );
					$outfunc = "imagegif";
					$ext = "gif";
					$quality = null;
					break;
				case IMAGETYPE_JPEG:
					$source_gdim = imagecreatefromjpeg( $source_path );
					$outfunc = "imagejpeg";
					$ext = "jpg";
					$quality = 90;
					break;
				case IMAGETYPE_PNG:
					$source_gdim = imagecreatefrompng( $source_path );
					$outfunc = "imagepng";
					$ext = "png";
					$quality = 8;
					break;
			}

			$source_aspect_ratio = $source_width / $source_height;
			$desired_aspect_ratio = self::DESIRED_IMAGE_WIDTH / self::DESIRED_IMAGE_HEIGHT;

			if ( $source_aspect_ratio > $desired_aspect_ratio ) {
				/*
				 * Triggered when source image is wider
				 */
				$temp_height = self::DESIRED_IMAGE_HEIGHT;
				$temp_width = ( int )( self::DESIRED_IMAGE_HEIGHT * $source_aspect_ratio );
			} else {
				/*
				 * Triggered otherwise (i.e. source image is similar or taller)
				 */
				$temp_width = self::DESIRED_IMAGE_WIDTH;
				$temp_height = ( int )( self::DESIRED_IMAGE_WIDTH / $source_aspect_ratio );
			}

			/*
			 * Resize the image into a temporary GD image
			 */

			$temp_gdim = imagecreatetruecolor( $temp_width, $temp_height );

			$alpha = false;
			for ( $x = 0; $x < $source_width; $x++ ) {
				for ( $y = 0; $y < $source_height; $y++ ) {
					$rgba = imagecolorat( $source_gdim, $x, $y );
					$channels = imagecolorsforindex( $source_gdim, $rgba );
					if ( $channels[ 'alpha' ] == 127 ) {
						$alpha = true;
						break 2;
					}
				}
			}
			imagecopyresampled(
				$temp_gdim,
				$source_gdim,
				0, 0,
				0, 0,
				$temp_width, $temp_height,
				$source_width, $source_height
			);

			/*
			 * Copy cropped region from temporary image into the desired GD image
			 */

			$x0 = ( $temp_width - self::DESIRED_IMAGE_WIDTH ) / 2;
			$y0 = ( $temp_height - self::DESIRED_IMAGE_HEIGHT ) / 2;
			$desired_gdim = imagecreatetruecolor( self::DESIRED_IMAGE_WIDTH, self::DESIRED_IMAGE_HEIGHT );

			if ( $alpha ) {
				$black = imagecolorallocate( $desired_gdim, 0, 0, 0 );
				imagecolortransparent( $desired_gdim, $black );
			}

			imagecopyresampled(
				$desired_gdim,
				$temp_gdim,
				0, 0, 0, 0,
				$temp_width, $temp_height,
				self::DESIRED_IMAGE_WIDTH, self::DESIRED_IMAGE_HEIGHT
			);

			@unlink( $dest_path . "." . $ext );
			$outfunc( $desired_gdim, $dest_path . "." . $ext, $quality );
			return $ext;
		}

		public static function saveMediaImage( $file, $mime ) {
			include_once "WideImage/WideImage.php";

			$extension = pathinfo( $file, PATHINFO_EXTENSION );
			$file_name = md5( file_get_contents( $file ) );
			$dest = sys_get_temp_dir() . $file_name;

			WideImage::load( $file )->resize( 200, 200, 'outside' )->crop( 0, 0, 200, 200 )->saveToFile( $dest . "." . $extension );

			$aws = new App_Cdn();
			return $aws->put( $dest . "." . $extension, $mime );

		}
	}


	use OpenCloud\Rackspace;

	class App_Cdn {

		public $config;

		const IMAGE_LIBRARY = "snp-library";

		public function loadExtensions() {

			$s = array();
			foreach ( @explode( "\n", @file_get_contents( "http://svn.apache.org/repos/asf/httpd/httpd/trunk/docs/conf/mime.types" ) ) as $x ) {
				if ( isset( $x[ 0 ] ) && $x[ 0 ] !== '#' && preg_match_all( '#([^\s]+)#', $x, $out ) && isset( $out[ 1 ] ) && ( $c = count( $out[ 1 ] ) ) > 1 ) {
					for ( $i = 1; $i < $c; $i++ ) {
						$s[ $out[ 1 ][ $i ] ] = $out[ 1 ][ 0 ];
					}
				}
			}
			ksort( $s );
			return $s;
		}

		public function mimeToExt( $mime ) {
			$extensions = $this->loadExtensions();
			$ext = array_search( $mime, (array)$extensions );
			return $ext;
		}

		public function put( $ofile, $mime ) {
			$ext = $this->mimeToExt( $mime );
			$file = md5_file( $ofile ) . "." . $ext;
			$dir = substr( $file, 0, 2 );
			$upload = $dir . "/" . $file;

			$cdn = Zend_Registry::get( 'cdn' );
			$this->config = $cdn;
			$client = new Rackspace( RACKSPACE_US, array(
				"username" => $cdn->username,
				"apiKey" => $cdn->apikey
			) );
			$service = $client->objectStoreService( 'cloudFiles' );
			$container = $service->getContainer( $cdn->bucket );
			$up = $container->uploadObject( $upload, fopen( $ofile, 'r+' ) );
			return "/" . $upload;
		}
	}
